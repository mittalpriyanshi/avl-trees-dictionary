const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY_SIZE = 1_000_000;

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 100;

const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "*";

// ============================================================
// AVL NODE
// ============================================================

class AVLNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;

    this.left = null;
    this.right = null;

    this.height = 1;
  }
}

// ============================================================
// AVL TREE
// ============================================================

class AVLTree {
  constructor() {
    this.root = null;

    // Information about the most recent operation.
    this.lastOperation = {
      type: null,
      key: null,
      rotation: null,
      rotationNode: null,
    };
  }

  height(node) {
    return node ? node.height : 0;
  }

  updateHeight(node) {
    node.height =
      1 +
      Math.max(
        this.height(node.left),
        this.height(node.right)
      );
  }

  balance(node) {
    if (!node) {
      return 0;
    }

    return (
      this.height(node.left) -
      this.height(node.right)
    );
  }

  // ----------------------------------------------------------
  // ROTATIONS
  // ----------------------------------------------------------

  rotateLeft(node) {
    const newRoot = node.right;

    node.right = newRoot.left;
    newRoot.left = node;

    this.updateHeight(node);
    this.updateHeight(newRoot);

    return newRoot;
  }

  rotateRight(node) {
    const newRoot = node.left;

    node.left = newRoot.right;
    newRoot.right = node;

    this.updateHeight(node);
    this.updateHeight(newRoot);

    return newRoot;
  }

  // ----------------------------------------------------------
  // REBALANCE
  // ----------------------------------------------------------

  rebalance(node) {
    this.updateHeight(node);

    const balanceFactor =
      this.balance(node);

    // --------------------------------------------------------
    // LEFT HEAVY
    // --------------------------------------------------------

    if (balanceFactor > 1) {
      // LR case
      if (
        this.balance(node.left) < 0
      ) {
        this.lastOperation.rotation =
          "LR";

        this.lastOperation.rotationNode =
          node.key;

        node.left =
          this.rotateLeft(node.left);

        return this.rotateRight(node);
      }

      // LL case
      this.lastOperation.rotation =
        "LL";

      this.lastOperation.rotationNode =
        node.key;

      return this.rotateRight(node);
    }

    // --------------------------------------------------------
    // RIGHT HEAVY
    // --------------------------------------------------------

    if (balanceFactor < -1) {
      // RL case
      if (
        this.balance(node.right) > 0
      ) {
        this.lastOperation.rotation =
          "RL";

        this.lastOperation.rotationNode =
          node.key;

        node.right =
          this.rotateRight(node.right);

        return this.rotateLeft(node);
      }

      // RR case
      this.lastOperation.rotation =
        "RR";

      this.lastOperation.rotationNode =
        node.key;

      return this.rotateLeft(node);
    }

    return node;
  }

  // ----------------------------------------------------------
  // INSERT
  // ----------------------------------------------------------

  insert(node, key, value) {
    if (!node) {
      return new AVLNode(
        key,
        value
      );
    }

    if (key < node.key) {
      node.left =
        this.insert(
          node.left,
          key,
          value
        );
    } else if (key > node.key) {
      node.right =
        this.insert(
          node.right,
          key,
          value
        );
    } else {
      // Existing key:
      // update its value instead of creating
      // a duplicate node.

      node.value = value;

      return node;
    }

    return this.rebalance(node);
  }

  insertPair(key, value) {
    this.lastOperation = {
      type: "INSERT",
      key,
      rotation: null,
      rotationNode: null,
    };

    const existed =
      this.find(
        this.root,
        key
      ) !== null;

    this.root =
      this.insert(
        this.root,
        key,
        value
      );

    return {
      inserted: !existed,
      updated: existed,
    };
  }

  // ----------------------------------------------------------
  // EXACT SEARCH
  // ----------------------------------------------------------

  find(node, key) {
    while (node) {
      if (key === node.key) {
        return node;
      }

      if (key < node.key) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    return null;
  }

  search(key) {
    const node =
      this.find(
        this.root,
        key
      );

    if (!node) {
      return null;
    }

    return {
      key: node.key,
      value: node.value,
    };
  }

  // ----------------------------------------------------------
  // PREFIX SEARCH
  //
  // A prefix query is treated as an ordered range:
  //
  //     prefix <= key <= prefix + '\uffff'
  //
  // Complexity:
  //
  //     O(log n + k)
  //
  // where k is the number of returned matches.
  // ----------------------------------------------------------

  searchPrefix(
    prefix,
    limit = DEFAULT_SEARCH_LIMIT
  ) {
    const result = [];

    if (
      !prefix ||
      !this.root ||
      limit <= 0
    ) {
      return result;
    }

    const upperBound =
      `${prefix}\uffff`;

    const collectRange = node => {
      if (
        !node ||
        result.length >= limit
      ) {
        return;
      }

      // There may be matching keys
      // in the left subtree.
      if (node.key > prefix) {
        collectRange(node.left);
      }

      // Check current node.
      if (
        result.length < limit &&
        node.key >= prefix &&
        node.key <= upperBound &&
        node.key.startsWith(prefix)
      ) {
        result.push({
          key: node.key,
          value: node.value,
        });
      }

      // There may be matching keys
      // in the right subtree.
      if (
        node.key < upperBound
      ) {
        collectRange(node.right);
      }
    };

    collectRange(this.root);

    return result;
  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete(node, key) {
    if (!node) {
      return null;
    }

    if (key < node.key) {
      node.left =
        this.delete(
          node.left,
          key
        );
    } else if (key > node.key) {
      node.right =
        this.delete(
          node.right,
          key
        );
    } else {
      // No left child
      if (!node.left) {
        return node.right;
      }

      // No right child
      if (!node.right) {
        return node.left;
      }

      // Two children.
      // Replace node with inorder successor.

      let successor =
        node.right;

      while (
        successor.left
      ) {
        successor =
          successor.left;
      }

      node.key =
        successor.key;

      node.value =
        successor.value;

      node.right =
        this.delete(
          node.right,
          successor.key
        );
    }

    return this.rebalance(node);
  }

  deleteKey(key) {
    const existingNode =
      this.find(
        this.root,
        key
      );

    if (!existingNode) {
      return false;
    }

    this.lastOperation = {
      type: "DELETE",
      key,
      rotation: null,
      rotationNode: null,
    };

    this.root =
      this.delete(
        this.root,
        key
      );

    return true;
  }

  // ----------------------------------------------------------
  // INORDER
  // ----------------------------------------------------------

  inorder(
    node,
    result = []
  ) {
    if (!node) {
      return result;
    }

    this.inorder(
      node.left,
      result
    );

    result.push({
      key: node.key,
      value: node.value,
    });

    this.inorder(
      node.right,
      result
    );

    return result;
  }

  // ----------------------------------------------------------
  // VALIDATE AVL
  // ----------------------------------------------------------

  validate(
    node = this.root,
    min = null,
    max = null
  ) {
    if (!node) {
      return {
        valid: true,
        height: 0,
      };
    }

    // BST ordering.
    if (
      (min !== null &&
        node.key <= min) ||
      (max !== null &&
        node.key >= max)
    ) {
      return {
        valid: false,
        height: 0,
      };
    }

    const left =
      this.validate(
        node.left,
        min,
        node.key
      );

    const right =
      this.validate(
        node.right,
        node.key,
        max
      );

    const expectedHeight =
      1 +
      Math.max(
        left.height,
        right.height
      );

    const balanced =
      Math.abs(
        left.height -
          right.height
      ) <= 1;

    const heightCorrect =
      node.height ===
      expectedHeight;

    return {
      valid:
        left.valid &&
        right.valid &&
        balanced &&
        heightCorrect,

      height:
        expectedHeight,
    };
  }
}

// ============================================================
// DICTIONARY
// ============================================================

const avl = new AVLTree();

// Local seed data.
//
// This is intentionally local so the server does not depend
// on the external dictionary API during startup.

const seedEntries = {
  apple:
    "A round fruit that typically has red, green, or yellow skin.",

  application:
    "A software program designed to perform a particular task.",

  banana:
    "A long curved fruit with a yellow skin when ripe.",

  cat:
    "A small domesticated carnivorous mammal.",

  computer:
    "An electronic device for storing and processing data.",

  dictionary:
    "A reference resource containing words and their meanings.",

  dog:
    "A domesticated mammal commonly kept as a companion or working animal.",

  elephant:
    "A very large mammal with a trunk and large ears.",

  keyboard:
    "A set of keys used to enter data into a computer.",

  monitor:
    "A display device used to show information from a computer.",

  mouse:
    "A handheld pointing device used to control a computer cursor.",

  window:
    "An opening in a wall fitted with glass or another transparent material.",
};

for (
  const [word, meaning]
  of Object.entries(seedEntries)
) {
  avl.insertPair(
    word,
    meaning
  );
}

// ============================================================
// HELPERS
// ============================================================

function normalizeWord(value) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toLowerCase();
}

function parseLimit(value) {
  const parsed =
    Number.parseInt(
      value,
      10
    );

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <= 0
  ) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(
    parsed,
    MAX_SEARCH_LIMIT
  );
}

function sendJson(
  res,
  statusCode,
  payload
) {
  res.writeHead(
    statusCode,
    {
      "Content-Type":
        "application/json; charset=utf-8",
    }
  );

  res.end(
    JSON.stringify(payload)
  );
}

function setCorsHeaders(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGIN
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

function readJsonBody(req) {
  return new Promise(
    (resolve, reject) => {
      let body = "";

      req.on(
        "data",
        chunk => {
          body += chunk;

          if (
            Buffer.byteLength(
              body,
              "utf8"
            ) >
            MAX_BODY_SIZE
          ) {
            reject(
              new Error(
                "Request body is too large"
              )
            );

            req.destroy();
          }
        }
      );

      req.on(
        "end",
        () => {
          try {
            resolve(
              JSON.parse(
                body || "{}"
              )
            );
          } catch {
            reject(
              new Error(
                "Invalid JSON body"
              )
            );
          }
        }
      );

      req.on(
        "error",
        reject
      );
    }
  );
}

// ============================================================
// EXTERNAL DICTIONARY API
// ============================================================

async function fetchMeaning(word) {
  const encodedWord =
    encodeURIComponent(word);

  try {
    const response =
      await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodedWord}`
      );

    if (!response.ok) {
      return "Meaning not found";
    }

    const data =
      await response.json();

    return (
      data[0]
        ?.meanings?.[0]
        ?.definitions?.[0]
        ?.definition ||
      "Meaning not found"
    );
  } catch (error) {
    console.error(
      "Dictionary API error:",
      error.message
    );

    return "Meaning not found";
  }
}

// ============================================================
// TREE SERIALIZATION
// ============================================================

function serializeTree(node) {
  if (!node) {
    return null;
  }

  return {
    key: node.key,

    value: node.value,

    height: node.height,

    balanceFactor:
      avl.balance(node),

    left:
      serializeTree(
        node.left
      ),

    right:
      serializeTree(
        node.right
      ),
  };
}

// ============================================================
// TREE RESPONSE
// ============================================================

function getTreeResponse() {
  const validation =
    avl.validate();

  return {
    tree:
      serializeTree(
        avl.root
      ),

    height:
      validation.height,

    valid:
      validation.valid,

    lastOperation:
      avl.lastOperation,
  };
}

// ============================================================
// HTTP SERVER
// ============================================================

const server =
  http.createServer(
    async (req, res) => {
      setCorsHeaders(res);

      // CORS preflight.
      if (
        req.method ===
        "OPTIONS"
      ) {
        res.writeHead(204);
        res.end();
        return;
      }

      const requestUrl =
        new URL(
          req.url,
          `http://${
            req.headers.host ||
            "localhost"
          }`
        );

      const pathname =
        requestUrl.pathname;

      try {
        // ====================================================
        // HEALTH
        // ====================================================

        if (
          pathname ===
            "/api/health" &&
          req.method === "GET"
        ) {
          sendJson(
            res,
            200,
            {
              status: "ok",
            }
          );

          return;
        }

        // ====================================================
        // INSERT
        // ====================================================

        if (
          pathname ===
            "/api/insert" &&
          req.method === "POST"
        ) {
          const body =
            await readJsonBody(
              req
            );

          const word =
            normalizeWord(
              body.word
            );

          const suppliedMeaning =
            typeof body.meaning ===
            "string"
              ? body.meaning.trim()
              : "";

          if (!word) {
            sendJson(
              res,
              400,
              {
                message:
                  "Word is required.",
              }
            );

            return;
          }

          if (word.length > 100) {
            sendJson(
              res,
              400,
              {
                message:
                  "Word is too long.",
              }
            );

            return;
          }

          if (
            suppliedMeaning.length >
            1000
          ) {
            sendJson(
              res,
              400,
              {
                message:
                  "Meaning is too long.",
              }
            );

            return;
          }

          const meaning =
            suppliedMeaning ||
            (await fetchMeaning(
              word
            ));

          const result =
            avl.insertPair(
              word,
              meaning
            );

          sendJson(
            res,
            result.updated
              ? 200
              : 201,
            {
              success: true,

              operation:
                result.updated
                  ? "UPDATE"
                  : "INSERT",

              word,

              meaning,

              rotation:
                avl.lastOperation
                  .rotation,

              rotationNode:
                avl.lastOperation
                  .rotationNode,

              ...getTreeResponse(),
            }
          );

          return;
        }

        // ====================================================
        // DELETE
        // ====================================================

        if (
          pathname ===
            "/api/delete" &&
          req.method === "DELETE"
        ) {
          const key =
            normalizeWord(
              requestUrl.searchParams.get(
                "key"
              )
            );

          if (!key) {
            sendJson(
              res,
              400,
              {
                message:
                  "Word is required.",
              }
            );

            return;
          }

          const deleted =
            avl.deleteKey(
              key
            );

          if (!deleted) {
            sendJson(
              res,
              404,
              {
                message:
                  `Word '${key}' was not found.`,
              }
            );

            return;
          }

          sendJson(
            res,
            200,
            {
              success: true,

              operation:
                "DELETE",

              word: key,

              rotation:
                avl.lastOperation
                  .rotation,

              rotationNode:
                avl.lastOperation
                  .rotationNode,

              ...getTreeResponse(),
            }
          );

          return;
        }

        // ====================================================
        // PREFIX SEARCH
        // ====================================================

        if (
          pathname ===
            "/api/search" &&
          req.method === "GET"
        ) {
          const prefix =
            normalizeWord(
              requestUrl.searchParams.get(
                "prefix"
              )
            );

          const limit =
            parseLimit(
              requestUrl.searchParams.get(
                "limit"
              )
            );

          // Do not return the entire
          // dictionary for an empty prefix.
          if (!prefix) {
            sendJson(
              res,
              200,
              []
            );

            return;
          }

          const result =
            avl.searchPrefix(
              prefix,
              limit
            );

          sendJson(
            res,
            200,
            result
          );

          return;
        }

        // ====================================================
        // TREE
        // ====================================================

        if (
          pathname ===
            "/api/tree" &&
          req.method === "GET"
        ) {
          sendJson(
            res,
            200,
            getTreeResponse()
          );

          return;
        }

        // ====================================================
        // ALL WORDS
        // ====================================================

        if (
          pathname ===
            "/api/all" &&
          req.method === "GET"
        ) {
          sendJson(
            res,
            200,
            avl.inorder(
              avl.root
            )
          );

          return;
        }

        // ====================================================
        // AVL VALIDATION
        // ====================================================

        if (
          pathname ===
            "/api/validate" &&
          req.method === "GET"
        ) {
          sendJson(
            res,
            200,
            avl.validate()
          );

          return;
        }

       // ============================================================
       // RESET TREE
      // ============================================================

if (
  pathname === "/api/reset" &&
  req.method === "POST"
) {
  avl.root = null;

  avl.lastOperation = {
    type: "RESET",
    key: null,
    rotation: null,
    rotationNode: null,
  };

  for (
    const [word, meaning]
    of Object.entries(seedEntries)
  ) {
    avl.insertPair(
      word,
      meaning
    );
  }

  avl.lastOperation = {
    type: "RESET",
    key: null,
    rotation: null,
    rotationNode: null,
  };

  sendJson(
    res,
    200,
    {
      success: true,
      operation: "RESET",
      ...getTreeResponse(),
    }
  );

  return;
}

        // ====================================================
        // UNKNOWN ROUTE
        // ====================================================

        sendJson(
          res,
          404,
          {
            message:
              "Route not found.",
          }
        );
      } catch (error) {
        console.error(
          "Request failed:",
          error
        );

        const status =
          error.message ===
            "Invalid JSON body" ||
          error.message ===
            "Request body is too large"
            ? 400
            : 500;

        sendJson(
          res,
          status,
          {
            message:
              error.message ||
              "Internal server error.",
          }
        );
      }
    }
  );

// ============================================================
// START SERVER
// ============================================================

server.listen(
  PORT,
  () => {
    const count =
      avl.inorder(
        avl.root
      ).length;

    console.log(
      `Backend running on port ${PORT}`
    );

    console.log(
      `AVL dictionary contains ${count} words`
    );

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );
  }
);