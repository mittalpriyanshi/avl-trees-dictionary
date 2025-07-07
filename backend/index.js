const http = require("http");
const url = require("url");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ---------------- AVL Tree ------------------

class AVLNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
  }

  height(node) {
    return node ? node.height : 0;
  }

  balance(node) {
    return this.height(node.left) - this.height(node.right);
  }

  rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    y.left = x;
    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
    return y;
  }

  rotateRight(y) {
    const x = y.left;
    y.left = x.right;
    x.right = y;
    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
    return x;
  }

  insert(node, key, value) {
    if (!node) return new AVLNode(key, value);

    if (key < node.key) node.left = this.insert(node.left, key, value);
    else if (key > node.key) node.right = this.insert(node.right, key, value);
    else {
      node.value = value;
      return node;
    }

    node.height =
      1 + Math.max(this.height(node.left), this.height(node.right));

    const balance = this.balance(node);

    if (balance > 1 && key < node.left.key) return this.rotateRight(node);
    if (balance < -1 && key > node.right.key) return this.rotateLeft(node);
    if (balance > 1 && key > node.left.key) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    if (balance < -1 && key < node.right.key) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  insertPair(key, value) {
    this.root = this.insert(this.root, key, value);
  }

  autocomplete(node, prefix, result) {
    if (!node) return;
    if (node.key.startsWith(prefix))
      result.push({ key: node.key, value: node.value });
    if (prefix <= node.key) this.autocomplete(node.left, prefix, result);
    if (prefix >= node.key) this.autocomplete(node.right, prefix, result);
  }

  searchPrefix(prefix) {
    const result = [];
    this.autocomplete(this.root, prefix, result);
    return result;
  }

  inorder(node, result = []) {
    if (!node) return result;
    this.inorder(node.left, result);
    result.push({ key: node.key, value: node.value });
    this.inorder(node.right, result);
    return result;
  }

  delete(node, key) {
    if (!node) return null;
  
    if (key < node.key) {
      node.left = this.delete(node.left, key);
    } else if (key > node.key) {
      node.right = this.delete(node.right, key);
    } else {
      // Node to delete found
      if (!node.left || !node.right) {
        node = node.left || node.right;
      } else {
        let temp = node.right;
        while (temp.left) temp = temp.left;
        node.key = temp.key;
        node.value = temp.value;
        node.right = this.delete(node.right, temp.key);
      }
    }
  
    if (!node) return null;
  
    // Update height
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
  
    // Balance
    const balance = this.balance(node);
  
    if (balance > 1 && this.balance(node.left) >= 0) return this.rotateRight(node);
    if (balance > 1 && this.balance(node.left) < 0) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
  
    if (balance < -1 && this.balance(node.right) <= 0) return this.rotateLeft(node);
    if (balance < -1 && this.balance(node.right) > 0) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }
  
    return node;
  }
  
  deleteKey(key) {
    this.root = this.delete(this.root, key);
  }
  

}

const avl = new AVLTree();

// ---------------- Word Fetching & Tree Population ------------------

const wordsToAdd = [
  "apple", "banana", "elephant",
  "keyboard", "monitor", "mouse", "window",
  "computer", "application", "dictionary", "cat", "dog"
];

async function addMeaning(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const definition = data[0].meanings[0].definitions[0].definition;
    avl.insertPair(word, definition);
    console.log(`✅ Inserted: ${word} → ${definition}`);
  } catch (e) {
    avl.insertPair(word, "Meaning not found");
    console.log(`❌ Failed: ${word} → ${e.message}`);
  }
}

function getTreeStructure(node) {
  if (!node) return null;
  return {
    key: node.key,
    value: node.value,
    left: getTreeStructure(node.left),
    right: getTreeStructure(node.right),
  };
}

// ---------------- HTTP Server ------------------

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  

  if (pathname === "/api/insert" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { word, meaning } = JSON.parse(body);
    
        if (!word) {
          res.writeHead(400);
          res.end(JSON.stringify({ message: "Word is required" }));
          return;
        }
    
        let definition = meaning;
    
        if (!definition) {
          try {
            const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await apiRes.json();
            definition = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || "Meaning not found";
          } catch {
            definition = "Meaning not found";
          }
        }
    
        avl.insertPair(word, definition);
        res.writeHead(200);
        res.end(JSON.stringify({ word, meaning: definition }));
    
      } catch (error) {
        console.error("❌ Insert failed:", error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ message: "Insert failed", error: error.message }));
      }
    });
    
  }

  else if (pathname === "/api/delete" && query.key) {
    avl.deleteKey(query.key);
    res.writeHead(200);
    res.end(JSON.stringify({ message: `${query.key} deleted` }));
  }
  
  else if (pathname === "/api/tree") {
    const tree = getTreeStructure(avl.root);
    res.writeHead(200);
    res.end(JSON.stringify(tree));
  }

  else if (pathname === "/api/search") {
    const prefix = query.prefix || "";
    const result = avl.searchPrefix(prefix);
    res.writeHead(200);
    res.end(JSON.stringify(result));
  }

  else if (pathname === "/api/all") {
    const result = avl.inorder(avl.root);
    res.writeHead(200);
    res.end(JSON.stringify(result));
  }

  else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

// ---------------- Start Server AFTER Tree Population ------------------

(async () => {
  for (const word of wordsToAdd) {
    await addMeaning(word);
  }

  const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
})();
