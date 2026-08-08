const BACKEND =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : "https://avl-trees-dictionary.onrender.com";

const SEARCH_LIMIT = 20;

// ============================================================
// DOM ELEMENTS
// ============================================================

const prefixInput =
  document.getElementById(
    "prefix"
  );

const searchButton =
  document.getElementById(
    "searchButton"
  );

const searchStatus =
  document.getElementById(
    "searchStatus"
  );

const resultsDiv =
  document.getElementById(
    "results"
  );

const insertWordInput =
  document.getElementById(
    "insertWord"
  );

const insertMeaningInput =
  document.getElementById(
    "insertMeaning"
  );

const insertButton =
  document.getElementById(
    "insertButton"
  );

const deleteWordInput =
  document.getElementById(
    "deleteWord"
  );

const deleteButton =
  document.getElementById(
    "deleteButton"
  );

const resetButton =
  document.getElementById(
    "resetButton"
  );

const treeSvg =
  document.getElementById(
    "treeSvg"
  );

const treeContainer =
  document.getElementById(
    "treeContainer"
  );

const treeMessage =
  document.getElementById(
    "treeMessage"
  );

const treeHeight =
  document.getElementById(
    "treeHeight"
  );

const avlStatus =
  document.getElementById(
    "avlStatus"
  );

const nodeCount =
  document.getElementById(
    "nodeCount"
  );

const operationDescription =
  document.getElementById(
    "operationDescription"
  );

const rotationBadge =
  document.getElementById(
    "rotationBadge"
  );

const rotationExplanation =
  document.getElementById(
    "rotationExplanation"
  );


// ============================================================
// STATE
// ============================================================

let searchTimer = null;

let currentTree = null;


// ============================================================
// GENERIC API HELPER
// ============================================================

async function apiRequest(
  endpoint,
  options = {}
) {
  const response =
    await fetch(
      `${BACKEND}${endpoint}`,
      options
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}


// ============================================================
// SEARCH
// ============================================================

async function searchWords() {
  const prefix =
    prefixInput.value.trim();

  if (!prefix) {
    resultsDiv.replaceChildren();

    searchStatus.textContent = "";

    return;
  }

  searchStatus.textContent =
    "Searching...";

  try {
    const encodedPrefix =
      encodeURIComponent(
        prefix
      );

    const data =
      await apiRequest(
        `/api/search?prefix=${encodedPrefix}&limit=${SEARCH_LIMIT}`
      );

    renderSearchResults(
      data
    );

    searchStatus.textContent =
      `${data.length} result${
        data.length === 1
          ? ""
          : "s"
      }`;

  } catch (error) {
    console.error(
      "Search error:",
      error
    );

    searchStatus.textContent =
      error.message;

    resultsDiv.replaceChildren();
  }
}


// ============================================================
// SEARCH RESULTS
// ============================================================

function renderSearchResults(
  data
) {
  resultsDiv.replaceChildren();

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    const message =
      document.createElement(
        "p"
      );

    message.className =
      "empty-message";

    message.textContent =
      "No matching words found.";

    resultsDiv.appendChild(
      message
    );

    return;
  }

  data.forEach(item => {
    const entry =
      document.createElement(
        "div"
      );

    entry.className =
      "entry";

    const word =
      document.createElement(
        "strong"
      );

    word.textContent =
      item.key;

    const meaning =
      document.createElement(
        "span"
      );

    meaning.textContent =
      `: ${item.value}`;

    entry.appendChild(
      word
    );

    entry.appendChild(
      meaning
    );

    resultsDiv.appendChild(
      entry
    );
  });
}


// ============================================================
// LIVE SEARCH
// ============================================================

prefixInput.addEventListener(
  "input",
  () => {
    clearTimeout(
      searchTimer
    );

    searchTimer =
      setTimeout(
        searchWords,
        250
      );
  }
);

searchButton.addEventListener(
  "click",
  searchWords
);

prefixInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
      "Enter"
    ) {
      searchWords();
    }
  }
);


// ============================================================
// INSERT
// ============================================================

async function insertWord() {
  const word =
    insertWordInput.value.trim();

  const meaning =
    insertMeaningInput.value.trim();

  if (!word) {
    alert(
      "Please enter a word."
    );

    return;
  }

  insertButton.disabled =
    true;

  insertButton.textContent =
    "Inserting...";

  try {
    const data =
      await apiRequest(
        "/api/insert",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              word,
              meaning,
            }),
        }
      );

    renderOperation(
      data
    );

    updateTreeFromResponse(
      data
    );

    insertWordInput.value =
      "";

    insertMeaningInput.value =
      "";

    // Refresh current search.
    if (
      prefixInput.value.trim()
    ) {
      await searchWords();
    }

  } catch (error) {
    console.error(
      "Insert error:",
      error
    );

    alert(
      `Insert failed: ${error.message}`
    );

  } finally {
    insertButton.disabled =
      false;

    insertButton.textContent =
      "Insert Word";
  }
}

insertButton.addEventListener(
  "click",
  insertWord
);

insertWordInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
      "Enter"
    ) {
      insertWord();
    }
  }
);


// ============================================================
// DELETE
// ============================================================

async function deleteWord() {
  const word =
    deleteWordInput.value.trim();

  if (!word) {
    alert(
      "Please enter a word."
    );

    return;
  }

  deleteButton.disabled =
    true;

  deleteButton.textContent =
    "Deleting...";

  try {
    const encodedWord =
      encodeURIComponent(
        word
      );

    const data =
      await apiRequest(
        `/api/delete?key=${encodedWord}`,
        {
          method: "DELETE",
        }
      );

    renderOperation(
      data
    );

    updateTreeFromResponse(
      data
    );

    deleteWordInput.value =
      "";

    if (
      prefixInput.value.trim()
    ) {
      await searchWords();
    }

  } catch (error) {
    console.error(
      "Delete error:",
      error
    );

    alert(
      `Delete failed: ${error.message}`
    );

  } finally {
    deleteButton.disabled =
      false;

    deleteButton.textContent =
      "Delete Word";
  }
}

deleteButton.addEventListener(
  "click",
  deleteWord
);

deleteWordInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
      "Enter"
    ) {
      deleteWord();
    }
  }
);


// ============================================================
// UPDATE TREE FROM API RESPONSE
// ============================================================

function updateTreeFromResponse(
  data
) {
  if (
    !data ||
    !("tree" in data)
  ) {
    return;
  }

  currentTree =
    data.tree;

  renderTree(
    currentTree
  );

  updateStats(
    data
  );
}


// ============================================================
// LOAD CURRENT TREE
// ============================================================

async function loadTree() {
  treeMessage.textContent =
    "Loading AVL tree...";

  try {
    const data =
      await apiRequest(
        "/api/tree"
      );

    currentTree =
      data.tree;

    renderTree(
      currentTree
    );

    updateStats(
      data
    );

  } catch (error) {
    console.error(
      "Tree loading error:",
      error
    );

    treeMessage.textContent =
      `Unable to load tree: ${error.message}`;
  }
}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStats(
  data
) {
  treeHeight.textContent =
    data.height ?? "-";

  avlStatus.textContent =
    data.valid
      ? "✓ Valid AVL"
      : "✕ Invalid AVL";

  avlStatus.className =
    data.valid
      ? "metric-value valid"
      : "metric-value invalid";

  nodeCount.textContent =
    countNodes(
      data.tree
    );
}

function countNodes(
  node
) {
  if (!node) {
    return 0;
  }

  return (
    1 +
    countNodes(node.left) +
    countNodes(node.right)
  );
}


// ============================================================
// OPERATION INFORMATION
// ============================================================

function renderOperation(
  data
) {
  const operation =
    data.operation;

  const key =
    data.word;

  const rotation =
    data.rotation;

  const rotationNode =
    data.rotationNode;

  if (!operation) {
    operationDescription.textContent =
      "No operation information.";

    return;
  }

  if (
    operation ===
    "INSERT"
  ) {
    operationDescription.textContent =
      `Inserted "${key}" into the AVL tree.`;
  } else if (
    operation ===
    "UPDATE"
  ) {
    operationDescription.textContent =
      `Updated the definition of "${key}".`;
  } else if (
    operation ===
    "DELETE"
  ) {
    operationDescription.textContent =
      `Deleted "${key}" from the AVL tree.`;
  }

  if (!rotation) {
    rotationBadge.textContent =
      "No rotation";

    rotationBadge.className =
      "badge neutral";

    rotationExplanation.textContent =
      "The tree remained balanced after this operation.";

    return;
  }

  rotationBadge.textContent =
    `${rotation} Rotation`;

  rotationBadge.className =
    "badge rotation";

  let explanation =
    "";

  switch (rotation) {
    case "LL":
      explanation =
        `LL imbalance detected at "${rotationNode}". ` +
        "A right rotation was performed.";
      break;

    case "RR":
      explanation =
        `RR imbalance detected at "${rotationNode}". ` +
        "A left rotation was performed.";
      break;

    case "LR":
      explanation =
        `LR imbalance detected at "${rotationNode}". ` +
        "A left rotation on the child was followed by a right rotation.";
      break;

    case "RL":
      explanation =
        `RL imbalance detected at "${rotationNode}". ` +
        "A right rotation on the child was followed by a left rotation.";
      break;

    default:
      explanation =
        "The AVL tree performed a balancing rotation.";
  }

  rotationExplanation.textContent =
    explanation;
}


// ============================================================
// RESET TREE
// ============================================================

async function resetTree() {
  const confirmed =
    window.confirm(
      "Reset the application to the initial dictionary?"
    );

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(
      "/api/reset",
      {
        method: "POST",
      }
    );

    operationDescription.textContent =
      "Tree reset to the initial dictionary.";

    rotationBadge.textContent =
      "Reset";

    rotationBadge.className =
      "badge neutral";

    rotationExplanation.textContent =
      "The original seed dictionary has been restored.";

    await loadTree();

    if (
      prefixInput.value.trim()
    ) {
      await searchWords();
    }

  } catch (error) {
    console.error(
      "Reset error:",
      error
    );

    alert(
      `Reset failed: ${error.message}`
    );
  }
}

resetButton.addEventListener(
  "click",
  resetTree
);


// ============================================================
// SVG HELPERS
// ============================================================

function createSvgElement(
  tag,
  attributes = {}
) {
  const element =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag
    );

  for (
    const [name, value]
    of Object.entries(
      attributes
    )
  ) {
    element.setAttribute(
      name,
      value
    );
  }

  return element;
}

// ============================================================
// TREE LAYOUT
// ============================================================


function calculateTreeLayout(root) {
  const nodes = [];

  let nextX = 0;
  let maxDepth = 0;

  const horizontalSpacing = 105;
  const levelSpacing = 105;

  function assignPosition(node, depth = 0) {
    if (!node) {
      return;
    }

    maxDepth = Math.max(
      maxDepth,
      depth
    );

    // Left subtree gets positions first.
    assignPosition(
      node.left,
      depth + 1
    );

    // Position this node between its
    // left and right subtree positions.
    node._x =
      55 +
      nextX * horizontalSpacing;

    node._y =
      55 +
      depth * levelSpacing;

    nextX++;

    // Right subtree.
    assignPosition(
      node.right,
      depth + 1
    );

    nodes.push({
      node,
      x: node._x,
      y: node._y,
      depth,
    });
  }

  assignPosition(root);

  return {
    nodes,
    maxDepth,
    width:
      Math.max(
        650,
        nextX * horizontalSpacing + 40
      ),
    height:
      Math.max(
        350,
        (maxDepth + 1) *
          levelSpacing +
          50
      ),
  };
}


// ============================================================
// TREE VISUALIZATION
// ============================================================

function renderTree(root) {
  treeSvg.replaceChildren();

  if (!root) {
    treeMessage.textContent =
      "The AVL tree is empty.";

    treeSvg.setAttribute(
      "viewBox",
      "0 0 800 420"
    );

    return;
  }

  treeMessage.textContent =
    "The tree updates automatically after every insert or delete.";

  const {
    nodes,
    width,
    height,
  } =
    calculateTreeLayout(root);

  treeSvg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );

  treeSvg.setAttribute(
    "width",
    width
  );

  treeSvg.setAttribute(
    "height",
    height
  );

  // ----------------------------------------------------------
  // EDGES
  // ----------------------------------------------------------
  //
  // Draw edges first.
  //
  // Nodes are drawn afterward, so the ends of the lines
  // disappear underneath the circles.
  //
  // This creates the clean appearance from the reference image.
  //
  // ----------------------------------------------------------

  nodes.forEach(
    ({ node }) => {
      if (node.left) {
        drawTreeEdge(
          node,
          node.left
        );
      }

      if (node.right) {
        drawTreeEdge(
          node,
          node.right
        );
      }
    }
  );

  // ----------------------------------------------------------
  // NODES
  // ----------------------------------------------------------

  nodes.forEach(
    ({ node }) => {
      drawTreeNode(
        node
      );
    }
  );

  // ----------------------------------------------------------
  // CENTER THE TREE
  // ----------------------------------------------------------

  centerTreeSvg(
    width,
    height
  );
}


// ============================================================
// DRAW TREE EDGE
// ============================================================

function drawTreeEdge(
  parent,
  child
) {
  const line =
    createSvgElement(
      "line",
      {
        x1: parent._x,
        y1: parent._y,

        x2: child._x,
        y2: child._y,

        class:
          "tree-edge",
      }
    );

  treeSvg.appendChild(
    line
  );
}


// ============================================================
// DRAW TREE NODE
// ============================================================

function drawTreeNode(node) {
  const group =
    createSvgElement(
      "g",
      {
        class:
          "tree-node",

        transform:
          `translate(${node._x}, ${node._y})`,
      }
    );

  // ----------------------------------------------------------
  // CIRCLE
  // ----------------------------------------------------------

  const circle =
    createSvgElement(
      "circle",
      {
        cx: 0,
        cy: 0,
        r: 35,

        class:
          getNodeClass(node),
      }
    );

  group.appendChild(
    circle
  );

  // ----------------------------------------------------------
  // WORD
  // ----------------------------------------------------------

  const keyText =
    createSvgElement(
      "text",
      {
        x: 0,
        y: 0,

        class:
          "tree-node-key",

        "dominant-baseline":
          "middle",

        "text-anchor":
          "middle",
      }
    );

  keyText.textContent =
    truncateTreeWord(
      node.key
    );

  group.appendChild(
    keyText
  );

  // ----------------------------------------------------------
  // TOOLTIP
  // ----------------------------------------------------------

  const title =
    createSvgElement(
      "title"
    );

  title.textContent =
    `${node.key}\n` +
    `Height: ${node.height}\n` +
    `Balance factor: ${node.balanceFactor}\n\n` +
    `${node.value}`;

  group.appendChild(
    title
  );

  treeSvg.appendChild(
    group
  );
}


// ============================================================
// NODE STYLE
// ============================================================

function getNodeClass(node) {
  const balance =
    node.balanceFactor;

  if (
    Math.abs(balance) > 1
  ) {
    return "tree-node-circle invalid";
  }

  if (
    balance === 1 ||
    balance === -1
  ) {
    return "tree-node-circle warning";
  }

  return "tree-node-circle";
}


// ============================================================
// WORD DISPLAY
// ============================================================

function truncateTreeWord(word) {
  if (word.length <= 11) {
    return word;
  }

  return (
    word.slice(0, 10) +
    "…"
  );
}


// ============================================================
// CENTER TREE
// ============================================================

function centerTreeSvg(
  width,
  height
) {
  treeSvg.style.display =
    "block";

  treeSvg.style.margin =
    "0 auto";

  treeSvg.style.minWidth =
    `${width}px`;

  treeSvg.style.minHeight =
    `${height}px`;
}


// ============================================================
// TEXT HELPERS
// ============================================================

function truncateText(
  text,
  maxLength
) {
  if (
    text.length <=
    maxLength
  ) {
    return text;
  }

  return (
    text.slice(
      0,
      maxLength - 1
    ) + "…"
  );
}


// ============================================================
// INITIALIZATION
// ============================================================

window.addEventListener(
  "load",
  loadTree
);