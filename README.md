# AVL Tree Dictionary

A full-stack dictionary application that uses an **AVL Tree** as its
underlying data structure.

The application supports:

- Prefix-based autocomplete
- Word insertion
- Word deletion
- Dictionary definitions fetched from an external API
- Real-time AVL tree visualization
- AVL tree validation

---

## Why an AVL Tree?

An AVL Tree is a self-balancing Binary Search Tree.

For every node:

```text
|height(left) - height(right)| <= 1
  
### 🔧 Tech Stack
- HTML, CSS, JavaScript (Frontend)
- Node.js (Backend with custom AVL logic)
- Dictionary API: [dictionaryapi.dev](https://dictionaryapi.dev)
  
### 🚀 Features
- 🔍 Prefix-based autocomplete
- 🖊️ User inserts new words (with optional meaning)
- ⛔ Words can be deleted
- 📈 AVL tree is dynamically rebalanced and drawn in canvas

### 📦 Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/avl-tree-project
cd avl-tree-project/backend
npm install
npm start
