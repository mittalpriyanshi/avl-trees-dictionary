# AVL Tree Dictionary Web App

A full-stack dictionary project that:
- Uses an AVL Tree to store words and definitions
- Supports live **search**, **insertion**, and **deletion**
- **Visualizes the AVL Tree** in real time
  
### Why AVL Trees?
- Self-balancing Binary Search Trees
- O(log n) time complexity for insert, delete, and search
- Outperform standard BSTs and hash tables in lookups
  
### 🔧 Tech Stack
- HTML, CSS, JavaScript (Frontend)
- Node.js (Backend with custom AVL logic)
- Dictionary API: [dictionaryapi.dev](https://dictionaryapi.dev)
  
### Features
- Prefix-based autocomplete
- User inserts new words (with optional meaning)
- Words can be deleted
- AVL tree is dynamically rebalanced and drawn in canvas

### Run Locally

```bash
git clone https://github.com/mittalpriyanshi/avl-trees-dictionary
cd avl-trees-dictionary/backend
npm install
node index.js
