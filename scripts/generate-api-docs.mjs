// Generate the API reference from a reviewed Aquadactyl checkout, without executing PHP.
// Usage: node scripts/generate-api-docs.mjs /path/to/aquadactyl
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(process.argv[2] || "../aquadactyl");
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const base = `https://github.com/Aquadactyl/aquadactyl/blob/${revision}/`;
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replaceAll("\r\n", "\n");
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
// Preserve offsets while ignoring quoted strings and comments for delimiter matching.
function mask(text) {
  return text.replace(
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (v) => v.replace(/[^\n]/g, " "),
  );
}
function close(text, start) {
  const clean = mask(text);
  const end = { "[": "]", "(": ")", "{": "}" }[clean[start]];
  let depth = 1;
  for (let i = start + 1; i < clean.length; i++) {
    if (clean[i] === clean[start]) depth++;
    if (clean[i] === end && --depth === 0) return i;
  }
  throw new Error(`Unclosed delimiter at ${start}`);
}
function split(text) {
  const clean = mask(text);
  const out = [];
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    if ("[({".includes(clean[i])) i = close(text, i);
    else if (clean[i] === ",") {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}
const strip = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "")
    .replace(/^ {8}/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
const inline = (text) =>
  `\`${text.replaceAll("`", "'").replaceAll("|", "\\|").replace(/\s+/g, " ")}\``;
const fence = (text, lang = "php") =>
  `\n\`\`\`${lang}\n${text.trim()}\n\`\`\`\n`;
const link = (file, label = file.split("/").at(-1)) =>
  `[${label}](${base}${file})`;
const slug = (v) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const classes = new Map();
function resolveClass(text, name) {
  if (name.startsWith("Pterodactyl\\")) return name;
  if (name.startsWith("\\")) return name.slice(1);
  const first = name.split("\\")[0];
  const uses = [...text.matchAll(/^use ([\w\\]+)(?: as (\w+))?;/gm)];
  const imported = uses.find(
    (m) => (m[2] || m[1].split("\\").at(-1)) === first,
  );
  return imported
    ? imported[1] + name.slice(first.length)
    : `${text.match(/namespace ([\w\\]+);/)[1]}\\${name}`;
}
function classInfo(name) {
  if (!name.startsWith("Pterodactyl\\")) return null;
  if (classes.has(name)) return classes.get(name);
  let file =
    name.replace(/^Pterodactyl\\/, "app/").replaceAll("\\", "/") + ".php";
  let text;
  if (!fs.existsSync(path.join(root, file))) {
    const short = name.split("\\").at(-1);
    const pattern = new RegExp(`class ${short}\\b`);
    const sibling = fs
      .readdirSync(path.join(root, path.dirname(file)))
      .find(
        (f) =>
          f.endsWith(".php") &&
          pattern.test(read(`${path.dirname(file)}/${f}`)),
      );
    if (!sibling) throw new Error(`Missing class ${file}`);
    file = `${path.dirname(file)}/${sibling}`;
    const full = read(file);
    const start = full.search(pattern);
    const open = full.indexOf("{", start);
    text =
      full.slice(0, full.indexOf("class ")) +
      full.slice(start, close(full, open) + 1);
  } else text = read(file);
  const parent = text.match(/class \w+ extends ([\w\\]+)/)?.[1];
  const info = {
    name,
    file,
    text,
    parent: parent ? resolveClass(text, parent) : null,
  };
  classes.set(name, info);
  return info;
}
function method(info, name, inherited = true) {
  if (!info) return null;
  const match = new RegExp(
    `(?:public|protected) (?:static )?function ${name}\\s*\\(`,
  ).exec(info.text);
  if (!match)
    return inherited && info.parent
      ? method(classInfo(info.parent), name)
      : null;
  const paramsStart = info.text.indexOf("(", match.index);
  const paramsEnd = close(info.text, paramsStart);
  const start = info.text.indexOf("{", paramsEnd);
  const end = close(info.text, start);
  return {
    info,
    params: info.text.slice(paramsStart + 1, paramsEnd),
    body: strip(info.text.slice(start + 1, end)),
    declaration: info.text.slice(match.index, end + 1),
  };
}
function arrayFields(text) {
  const start = text.indexOf("[");
  if (start < 0) return [];
  return split(text.slice(start + 1, close(text, start))).flatMap((entry) => {
    const match = /^\s*['"]([^'"]+)['"]\s*=>\s*([\s\S]*)$/.exec(strip(entry));
    return match ? [[match[1], match[2]]] : [];
  });
}
function rules(info) {
  const m = method(info, "rules");
  if (!m) return { fields: [], extra: "", source: info };
  const model = m.body.match(/(\w+)::getRules(?:ForUpdate)?\(/)?.[1];
  const modelInfo = model ? classInfo(resolveClass(m.info.text, model)) : null;
  const modelRules = modelInfo
    ? new Map(
        arrayFields(
          modelInfo.text.slice(modelInfo.text.indexOf("$validationRules =")),
        ),
      )
    : new Map();
  const asRules = (value) =>
    /^'[^']*'$/.test(value)
      ? `[${value
          .slice(1, -1)
          .split("|")
          .map((v) => `'${v}'`)
          .join(", ")}]`
      : value;
  const expand = (value) =>
    value
      .replace(/\$(?:rules|data)\[['"]([^'"]+)['"]\]/g, (_, key) =>
        asRules(modelRules.get(key) || `model rule: ${key}`),
      )
      .replace(/(\w+)::getRulesForField\('([^']+)'\)/g, (_, modelName, key) => {
        const source = classInfo(resolveClass(m.info.text, modelName));
        return (
          new Map(
            arrayFields(
              source.text.slice(source.text.indexOf("$validationRules =")),
            ),
          ).get(key) || `${modelName} rule: ${key}`
        );
      });
  let fields = arrayFields(m.body.match(/return\s+(\[[\s\S]*)/)?.[1] || "");
  const only = m.body.match(/->only\((\[[\s\S]*?\])\)/)?.[1];
  if (only)
    fields = [...only.matchAll(/'([^']+)'/g)].map((x) => [
      x[1],
      modelRules.get(x[1]) || x[1],
    ]);
  if (m.body.includes("$response['first_name']"))
    fields.push(
      ["first_name", modelRules.get("name_first")],
      ["last_name", modelRules.get("name_last")],
    );
  if (m.body.includes("parent::rules(")) {
    const parent = rules(classInfo(m.info.parent));
    fields = parent.fields;
  }
  fields = fields.map(([key, value]) => [key, expand(value)]);
  // Keep executable/conditional validation visible rather than guessing its meaning.
  const conditional = method(info, "withValidator", false);
  const extra = conditional ? conditional.body : "";
  return { fields, extra, source: m.info, modelInfo, raw: m.body };
}

function routes(file, prefix, family) {
  const text = read(file);
  const result = [];
  function walk(body, current) {
    let offset = 0;
    while (true) {
      const start = body.indexOf("Route::", offset);
      if (start < 0) break;
      const clean = mask(body);
      let end = start;
      for (; end < clean.length; end++) {
        if ("[({".includes(clean[end])) end = close(body, end);
        else if (clean[end] === ";") break;
      }
      const statement = body.slice(start, end + 1);
      offset = end + 1;
      const group = /function\s*\(\)\s*\{/.exec(statement);
      if (group) {
        const head = statement.slice(0, group.index);
        const sub =
          head.match(/'prefix'\s*=>\s*'([^']*)'/)?.[1] ??
          head.match(/::prefix\('([^']*)'\)/)?.[1] ??
          "";
        const open = statement.indexOf("{", group.index);
        walk(
          statement.slice(open + 1, close(statement, open)),
          `${current}/${sub}`.replace(/\/+/g, "/"),
        );
        continue;
      }
      const route =
        /(?:::|->)(get|post|put|patch|delete)\(\s*'([^']*)'\s*,\s*(?:\[([\w\\]+)::class,\s*'([^']+)'\]|([\w\\]+)::class)/.exec(
          statement,
        );
      if (!route) continue; // UI fallbacks are not API operations.
      const fullPath = `${current}/${route[2]}`
        .replace(/\/+/g, "/")
        .replace(/\/$/, "");
      const controller = classInfo(resolveClass(text, route[3] || route[5]));
      const handler = method(controller, route[4] || "__invoke");
      if (!handler) throw new Error(`Missing handler for ${fullPath}`);
      result.push({
        family,
        method: route[1].toUpperCase(),
        path: fullPath,
        controller,
        handler,
        handlerName: route[4] || "__invoke",
        routeFile: file,
        statement,
      });
    }
  }
  walk(text, prefix);
  return result;
}

const operations = [
  ...routes("routes/api-client.php", "/api/client", "client"),
  ...routes("routes/api-application.php", "/api/application", "application"),
  ...routes("routes/api-remote.php", "/api/remote", "remote"),
  ...routes(
    "routes/blueprint/client.php",
    "/api/client/extensions",
    "blueprint",
  ),
];
// Route count checks catch unrecognised syntax, including chained middleware routes.
for (const family of ["client", "application", "remote"]) {
  const expected = [
    ...read(`routes/api-${family}.php`).matchAll(
      /(?:::|->)(get|post|put|patch|delete)\(/g,
    ),
  ].length;
  if (operations.filter((o) => o.family === family).length !== expected)
    throw new Error(`Incomplete ${family} route coverage`);
}
const groups = new Map();
const transformers = new Map();
const inventory = [];
// Include transformers used by relationships, not only top-level controllers.
for (const family of ["Client", "Application"]) {
  for (const file of fs.readdirSync(
    path.join(root, "app/Transformers/Api", family),
  )) {
    if (!file.endsWith("Transformer.php") || file.startsWith("Base")) continue;
    const name = `Pterodactyl\\Transformers\\Api\\${family}\\${file.slice(0, -4)}`;
    const info = classInfo(name);
    if (method(info, "transform", false)) transformers.set(name, info);
  }
}
const permissionConstants = read("app/Models/Permission.php");
for (const op of operations) {
  const { handler, controller } = op;
  const requestName = handler.params.match(/([\w\\]+Request)\s+\$request/)?.[1];
  const request = requestName
    ? classInfo(resolveClass(handler.info.text, requestName))
    : null;
  const validation = request ? rules(request) : { fields: [], extra: "" };
  if (!validation.fields.length) {
    const local = handler.body.match(
      /(?:->validate\((?:\$request,\s*)?|->make\(\$request->all\(\),\s*)(\[[\s\S]*)/,
    )?.[1];
    if (local) validation.fields = arrayFields(local);
  }
  const permissions = request ? method(request, "permission") : null;
  const auth = request ? method(request, "authorize") : null;
  const constant = permissions?.body.match(/Permission::(\w+)/)?.[1];
  const permission = constant
    ? permissionConstants.match(new RegExp(`${constant} = '([^']+)'`))?.[1]
    : null;
  const inheritedText = (info) =>
    info
      ? info.text + (info.parent ? inheritedText(classInfo(info.parent)) : "")
      : "";
  const aclResource = inheritedText(request).match(
    /\$resource = AdminAcl::RESOURCE_(\w+)/,
  )?.[1];
  const aclLevel = inheritedText(request).match(
    /\$permission = AdminAcl::(\w+)/,
  )?.[1];
  const transformNames = [
    ...handler.body.matchAll(
      /(?:getTransformer\(|transformWith\()([\w\\]+Transformer)::class/g,
    ),
  ].map((m) => resolveClass(controller.text, m[1]));
  for (const name of transformNames) transformers.set(name, classInfo(name));
  const segment = op.path
    .slice(`/api/${op.family}`.length)
    .split("/")
    .filter(Boolean);
  const group = ["remote", "blueprint"].includes(op.family)
    ? op.family
    : `${op.family}/${segment[0] === "servers" && op.family === "client" ? segment[2] || "servers" : segment[0] || "servers"}`;
  const normalizedGroup = group.replace(
    /client\/(resources|query|activity|command|console|power|websocket)/,
    "client/servers",
  );
  if (!groups.has(normalizedGroup)) groups.set(normalizedGroup, []);
  const id = slug(`${op.method} ${op.path}`);
  const beforeMethod = handler.info.text.slice(
    0,
    handler.info.text.indexOf(handler.declaration),
  );
  const summary = beforeMethod
    .slice(beforeMethod.lastIndexOf("/**"))
    .match(/\/\*\*([\s\S]*?)\*\/\s*$/)?.[1]
    ?.split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .filter((l) => !l.startsWith("@"))
    .join(" ")
    .trim();
  const codes =
    /returnNoContent|->noContent\(|HTTP_NO_CONTENT|new JsonResponse\(\[\], 204\)|response\('', 204\)|return \$this->processFailedTransfer\(/.test(
      handler.body,
    )
      ? "204"
      : /HTTP_ACCEPTED/.test(handler.body)
        ? "202"
        : /->respond\(201\)|HTTP_CREATED/.test(handler.body)
          ? "201"
          : /return redirect|->redirect\(/.test(handler.body)
            ? "302"
            : "200";
  let content = `<span id="${id}" />\n\n## ${op.method} ${inline(op.path)}\n\n${summary || `Calls ${controller.name.split("\\").at(-1)}::${routeMethod(op)}.`}\n\n`;
  const access =
    op.family === "remote"
      ? "Wings node bearer credentials; internal callback."
      : op.family === "application"
        ? `Administrator account${aclResource ? `; ${inline(aclResource.toLowerCase())} ACL ${inline(aclLevel || "inherited")}` : ""}.`
        : `Client API key or authenticated panel session${permission ? `; ${inline(permission)}` : ""}.`;
  content += `**Access:** ${access}\n\n`;
  content += `**Source:** ${link(op.routeFile, "Route")} · ${link(controller.file, "Controller")}${request ? ` · ${link(request.file, "Request validation")}` : ""}\n\n`;
  if (validation.source && validation.source.file !== request?.file)
    content += `Validation is inherited from ${link(validation.source.file)}.\n\n`;
  if (validation.modelInfo)
    content += `Model constraints: ${link(validation.modelInfo.file)} (including runtime rules and uniqueness checks for updates).\n\n`;
  const params = [...op.path.matchAll(/\{([^}]+)\}/g)];
  if (params.length)
    content += `**Path parameters:** ${params.map((m) => inline(m[1])).join(", ")}. See [identifiers](/docs/api/authentication#identifiers).\n\n`;
  if (validation.fields.length) {
    content += `### ${op.method === "GET" ? "Query" : "Input"} fields\n\nRules use [Laravel validation syntax](/docs/api/authentication#validation). Dotted keys describe nested objects; ${inline("*")} describes each array member. Model-derived rules are shown as their source expressions; model methods can add runtime constraints.\n\n| Field | Validation |\n| --- | --- |\n`;
    content +=
      validation.fields
        .map(([key, value]) => `| ${inline(key)} | ${inline(value)} |`)
        .join("\n") + "\n\n";
  }
  const queryCalls = [
    ...handler.body.matchAll(
      /\$request->(?:query|input)\(\s*'([^']+)'(?:,\s*([^)]*))?\)/g,
    ),
  ];
  const additional = [
    ...new Map(queryCalls.map((m) => [m[1], m])).values(),
  ].filter((m) => !validation.fields.some(([key]) => key === m[1]));
  if (additional.length)
    content += `**Other controller inputs:** ${additional.map((m) => `${inline(m[1])}${m[2] ? ` (default ${inline(m[2])})` : ""}`).join(", ")}.\n\n`;
  const filters = handler.body.match(
    /->allowedFilters\(([\s\S]*?)\)\s*(?:;|->)/,
  )?.[1];
  const sorts = handler.body.match(/->allowedSorts\(([^)]*)\)/)?.[1];
  if (filters || sorts)
    content += `**List query options:** ${filters ? `filters declared in ${inline(filters)}` : ""}${sorts ? `; sorts ${inline(sorts)}` : ""}. Use ${inline("filter[name]=value")} and ${inline("sort=-id")} only with supported fields.\n\n`;
  if (validation.extra)
    content += `<details>\n<summary>Conditional validation</summary>\n${fence(validation.extra)}\n</details>\n\n`;
  // Include custom authorization: password confirmation, owner protection, feature flags, etc.
  if (
    auth &&
    auth.body !== "return true;" &&
    !["ClientApiRequest", "ApplicationApiRequest"].includes(
      auth.info.name.split("\\").at(-1),
    )
  )
    content += `<details>\n<summary>Additional authorization checks</summary>\n${fence(auth.body)}\n</details>\n\n`;
  if (permissions && !constant)
    content += `<details>\n<summary>Permission selection</summary>\n${fence(permissions.body)}\n</details>\n\n`;
  content += `### Response\n\nSuccess: **${codes}**${codes === "204" ? " (empty body)" : ""}. ${transformNames.length ? `Response attributes: ${transformNames.map((name) => `[${name.split("\\").at(-2)} ${name.split("\\").at(-1)}](/docs/api/responses#${slug(name.replace("Pterodactyl\\Transformers\\Api\\", ""))})`).join(", ")}. Collections use the list envelope described in [conventions](/docs/api/authentication#responses-and-pagination).` : ""}\n\n`;
  content += `<details>\n<summary>Response construction and endpoint behavior</summary>\n\nThis source excerpt includes conditional responses, metadata, pagination, and service calls for this operation.\n${fence(handler.body)}\n</details>\n\n`;
  const examplePath = op.path
    .replace(
      /\{server(?::id)?\}/g,
      op.family === "application" ? "1" : "SERVER_UUID",
    )
    .replace(/\{force\?\}/g, "force")
    .replace(/\{[^}]+\}/g, "RESOURCE_ID");
  if (op.method === "GET" && op.family !== "remote") {
    const queryExamples = {
      file: "/example.txt",
      memory: "2048",
      disk: "10240",
    };
    const queryArgs = validation.fields
      .filter(([key, rule]) => !key.includes(".") && /\brequired\b/.test(rule))
      .map(
        ([key]) => `--data-urlencode "${key}=${queryExamples[key] || "VALUE"}"`,
      );
    const args = [
      `curl --get "\${PANEL_URL}${examplePath}"`,
      `--header "Authorization: Bearer \${${op.family === "application" ? "APPLICATION" : "CLIENT"}_API_KEY}"`,
      '--header "Accept: application/json"',
      ...queryArgs,
    ];
    content += `### Example request\n${fence(args.join(" \\\n  "), "bash")}\n`;
  }
  groups.get(normalizedGroup).push(content);
  inventory.push({
    family: op.family,
    method: op.method,
    path: op.path,
    controller: `${controller.name}::${routeMethod(op)}`,
    request: request?.file || null,
    fields: validation.fields,
    successStatus: Number(codes),
    documentation: `/docs/api/${normalizedGroup}`,
    source: `${base}${controller.file}`,
    id,
  });
}
function routeMethod(op) {
  return op.handlerName;
}
const titles = {
  "client/servers": "Servers, console and power",
  "client/permissions": "Permission catalogue",
  "client/account": "Account, security and API keys",
  "client/trash": "File trash",
  "client/files": "Files and uploads",
  "client/databases": "Server databases",
  "client/schedules": "Schedules and tasks",
  "client/network": "Network allocations",
  "client/users": "Subusers",
  "client/backups": "Backups",
  "client/startup": "Startup variables",
  "client/settings": "Server settings",
  "application/users": "Users",
  "application/nodes": "Nodes and allocations",
  "application/locations": "Locations",
  "application/servers": "Servers and databases",
  "application/nests": "Nests and eggs",
  remote: "Wings callback API",
  session: "Browser endpoint reference",
  blueprint: "Blueprint extension API",
};
for (const [group, sections] of groups) {
  if (!titles[group]) throw new Error(`Missing group title ${group}`);
  if (group === "blueprint")
    sections.unshift(
      `## Extension route prefixes\n\nBlueprint mounts extension route files beneath these prefixes:\n\n| Manifest entry | Resulting prefix | Middleware |\n| --- | --- | --- |\n| \`requests.routers.client\` | \`/api/client/extensions/{identifier}\` | Client session/key, IP restrictions, 2FA and Client rate limiting. |\n| \`requests.routers.application\` | \`/api/application/extensions/{identifier}\` | Administrator and API middleware; implement resource ACL checks in your request class. |\n| \`requests.routers.web\` | \`/extensions/{identifier}\` | Web session and CSRF middleware; add route-specific authentication/authorization. |\n\nThese prefixes do not automatically authorize a user for a particular server. Add server binding, access, ownership and permission checks for server-specific endpoints. Installed extensions define their own methods and payloads; consult each extension's reference. The built-in endpoint below returns the egg IDs enabled for an extension; \`["-1"]\` means all eggs. The optional \`id\` query parameter defaults to \`blueprint\`.\n\nSource: ${link("app/Providers/Blueprint/RouteServiceProvider.php", "Blueprint route provider")}. The [development guide](/docs/blueprint/development) explains manifest layout.\n`,
    );
  if (group === "remote")
    sections.unshift(
      `## Node authentication\n\nWings calls the panel using \`Authorization: Bearer TOKEN_ID.TOKEN_SECRET\`, matching the node's configured daemon token. This is not a Client or Application API key. The middleware resolves the node and compares its decrypted secret using a constant-time check. Missing credentials return 401, malformed credentials return 400, and a rejected credential returns 403. Scope callbacks to resources belonging to that node.\n\nThese are internal Wings-to-panel callbacks. Prefer the Client or Application API for user integrations. A 204 callback result has no response body. See ${link("app/Http/Middleware/Api/Daemon/DaemonAuthenticate.php", "node authentication middleware")}.\n`,
    );
  const count = inventory.filter(
    (op) => op.documentation === `/docs/api/${group}`,
  ).length;
  write(
    `docs/api/${group}.mdx`,
    `---\ntitle: ${titles[group]}\ndescription: ${count} source-verified ${group.split("/")[0]} API operations in Aquadactyl.\n---\n\nGenerated from [Aquadactyl ${revision.slice(0, 12)}](${base.replace("/blob/", "/tree/")}). Read [authentication and conventions](/docs/api/authentication) first. ${group === "remote" ? "These endpoints are called by Wings, using node credentials. They are not the API served by Wings itself." : ""}\n\n${sections.join("\n---\n\n")}`,
  );
}
let responseDoc = `---\ntitle: Response objects\ndescription: Exact response attributes and relationships from Aquadactyl API transformers.\n---\n\nThese are the attribute definitions from [Aquadactyl ${revision.slice(0, 12)}](${base.replace("/blob/", "/tree/")}). They sit inside the resource envelope described in [conventions](/docs/api/authentication#responses-and-pagination). PHP expressions describe how values are constructed; conditional relationships and secret fields are not always present. Non-transformer endpoints document their response construction on their own reference page.\n\n`;
for (const [name, info] of [...transformers].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  const title = name
    .replace("Pterodactyl\\Transformers\\Api\\", "")
    .replaceAll("\\", " ");
  const transform = method(info, "transform");
  const relationships =
    info.text.match(
      /\$(?:availableIncludes|defaultIncludes)\s*=\s*\[[\s\S]*?\];/g,
    ) || [];
  responseDoc += `## ${title}\n\n${link(info.file, "Transformer source")}.\n\n`;
  const attributes = [];
  function describeFields(fields, prefix = "") {
    for (const [key, value] of fields) {
      const name = `${prefix}${key}`;
      if (value.trim().startsWith("[")) {
        const nested = arrayFields(value);
        attributes.push([name, nested.length ? "Nested object" : "Array"]);
        if (nested.length) describeFields(nested, `${name}.`);
      } else attributes.push([name, value]);
    }
  }
  describeFields(
    arrayFields(transform.body.match(/return\s+(\[[\s\S]*)/)?.[1] || ""),
  );
  if (attributes.length)
    responseDoc += `| Attribute | Value construction |\n| --- | --- |\n${attributes.map(([field, value]) => `| ${inline(field)} | ${inline(value)} |`).join("\n")}\n\n`;
  responseDoc += `<details>\n<summary>Exact transformation and conditional fields</summary>\n${fence(transform.body)}\n</details>\n\n`;
  if (relationships.length)
    responseDoc += `Relationships: ${relationships.map(inline).join("; ")}. Requested includes are subject to the transformer and the caller's permissions.\n\n`;
}
write("docs/api/responses.mdx", responseDoc);
for (const family of ["client", "application"])
  write(
    `docs/api/${family}/meta.json`,
    JSON.stringify(
      {
        title: family === "client" ? "Client API" : "Application API",
        pages: [...groups.keys()]
          .filter((k) => k.startsWith(`${family}/`))
          .map((k) => k.split("/")[1]),
      },
      null,
      2,
    ) + "\n",
  );
write(
  "public/api/reference.json",
  JSON.stringify(
    {
      repository: "Aquadactyl/aquadactyl",
      revision,
      routeCount: operations.length,
      operations: inventory,
    },
    null,
    2,
  ) + "\n",
);
write("public/api/AQUADACTYL-LICENSE.md", read("LICENSE.md"));
console.log(
  `Generated ${operations.length} operations, ${groups.size} reference pages and ${transformers.size} response objects from ${revision}.`,
);
