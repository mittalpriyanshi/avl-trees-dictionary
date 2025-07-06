async function searchWords() {
  const prefix = document.getElementById("prefix").value.trim();
  if (prefix.length === 0) {
    document.getElementById("results").innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3001/api/search?prefix=${prefix}`);
    const data = await res.json();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `<strong>${item.key}</strong>: ${item.value}`;
      resultsDiv.appendChild(div);
    });
  } catch (error) {
    console.error("Autocomplete error:", error);
  }
}

async function drawAVL() {
  const res = await fetch("http://localhost:3001/api/tree");
  const tree = await res.json();

  const canvas = document.getElementById("treeCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 35;
  const levelHeight = 120;
  const minGap = 80; // minimum horizontal gap between sibling nodes

  // Step 1: Assign width (number of leaves under a node)
  function assignWidth(node) {
    if (!node) return 0;
    const left = assignWidth(node.left);
    const right = assignWidth(node.right);
    node._width = Math.max(1, left + right); // width can't be 0
    return node._width;
  }

  // Step 2: Assign x positions recursively
  function assignPositions(node, x, y, spacing) {
    if (!node) return;

    node._x = x;
    node._y = y;

    const totalWidth = spacing * node._width;

    if (node.left) {
      const leftWidth = spacing * node.left._width;
      assignPositions(node.left, x - totalWidth / 2 + leftWidth / 2, y + levelHeight, spacing);
    }

    if (node.right) {
      const rightWidth = spacing * node.right._width;
      assignPositions(node.right, x + totalWidth / 2 - rightWidth / 2, y + levelHeight, spacing);
    }
  }

  // Step 3: Render
  function renderTree(node) {
    if (!node) return;

    const { _x, _y } = node;

    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(_x, _y + radius);
      ctx.lineTo(node.left._x, node.left._y - radius);
      ctx.stroke();
      renderTree(node.left);
    }

    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(_x, _y + radius);
      ctx.lineTo(node.right._x, node.right._y - radius);
      ctx.stroke();
      renderTree(node.right);
    }

    ctx.beginPath();
    ctx.arc(_x, _y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#bde0fe";
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px sans-serif";
    ctx.fillText(node.key, _x, _y);
  }

  if (!tree || !tree.key) {
    alert("Tree is empty or failed to load.");
    return;
  }

  assignWidth(tree);
  assignPositions(tree, canvas.width / 2, 50, minGap);
  renderTree(tree);
}
