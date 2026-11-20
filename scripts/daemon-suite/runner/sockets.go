package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

func (h *harness) token(n node, s server, scope string, modify func(map[string]any)) string {
	claims := map[string]any{"iat": time.Now().Unix() - 1, "nbf": time.Now().Unix() - 5, "exp": time.Now().Add(time.Hour).Unix(), "jti": "benchmark", "scope": scope, "server_uuid": s.UUID, "user_uuid": h.SFTP.UserUUID, "unique_id": fmt.Sprintf("benchmark-%d", time.Now().UnixNano()), "permissions": []string{"websocket.connect", "control.console"}}
	if modify != nil {
		modify(claims)
	}
	b, err := json.Marshal(claims)
	must(err)
	enc := base64.RawURLEncoding
	message := enc.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`)) + "." + enc.EncodeToString(b)
	mac := hmac.New(sha256.New, []byte(n.Token))
	_, err = mac.Write([]byte(message))
	must(err)
	return message + "." + enc.EncodeToString(mac.Sum(nil))
}
func (h *harness) socket(n node, s server, token string) (*websocket.Conn, string) {
	address := strings.Replace(n.Base, "http://", "ws://", 1) + "/api/servers/" + s.UUID + "/ws"
	c, _, err := websocket.DefaultDialer.Dial(address, http.Header{"Origin": []string{h.PanelOrigin}})
	must(err)
	must(c.SetReadDeadline(time.Now().Add(5 * time.Second)))
	must(c.WriteJSON(map[string]any{"event": "auth", "args": []string{token}}))
	for i := 0; i < 10; i++ {
		var v struct {
			Event string `json:"event"`
		}
		if err := c.ReadJSON(&v); err != nil {
			return c, "closed"
		}
		if v.Event == "auth success" || v.Event == "jwt error" || v.Event == "daemon error" {
			return c, v.Event
		}
	}
	return c, "no authentication result"
}
func (h *harness) websocketLoad(variant string, n node, s server, round int) {
	prefix := fmt.Sprintf("BENCHWS-%d-", time.Now().UnixNano())
	commands := []string{}
	for i := 0; i < 100; i++ {
		commands = append(commands, fmt.Sprintf("say %s%03d", prefix, i))
	}
	var wg sync.WaitGroup
	var mu sync.Mutex
	lat := []float64{}
	ready := make(chan struct{})
	var started time.Time
	for i := 0; i < 16; i++ {
		c, event := h.socket(n, s, h.token(n, s, "websocket", nil))
		checkWebsocketAuthentication(event)
		wg.Add(1)
		go func() {
			defer wg.Done()
			defer c.Close()
			<-ready
			must(c.SetReadDeadline(time.Now().Add(12 * time.Second)))
			collectBenchmarkWebsocketMessages(func() ([]byte, error) {
				_, b, err := c.ReadMessage()
				return b, err
			}, prefix, 100, func() {
				mu.Lock()
				lat = append(lat, float64(time.Since(started).Microseconds())/1000)
				mu.Unlock()
			})
		}()
	}
	started = time.Now()
	close(ready)
	h.commands(n, s, commands...)
	wg.Wait()
	row := distribution(lat)
	row["type"] = "measurement"
	row["test"] = "websocket_16_subscribers_100_lines"
	row["variant"] = variant
	row["round"] = round
	row["expected_messages"] = 1600
	row["received_messages"] = len(lat)
	h.add(row)
}

func checkWebsocketAuthentication(event string) {
	if event != "auth success" {
		panic("valid websocket authentication failed: " + event)
	}
}

func websocketReadFailed(err error) bool {
	return err != nil
}

func benchmarkWebsocketMessageID(data []byte, prefix string) (string, bool) {
	p := strings.Index(string(data), prefix)
	if p < 0 || len(data) < p+len(prefix)+3 {
		return "", false
	}
	return string(data[p+len(prefix) : p+len(prefix)+3]), true
}

func collectBenchmarkWebsocketMessages(read func() ([]byte, error), prefix string, count int, onNewMessage func()) {
	received := make(map[string]bool, count)
	for len(received) < count {
		data, err := read()
		if websocketReadFailed(err) {
			return
		}
		id, ok := benchmarkWebsocketMessageID(data, prefix)
		if !ok {
			continue
		}
		if !received[id] {
			received[id] = true
			onNewMessage()
		}
	}
}
