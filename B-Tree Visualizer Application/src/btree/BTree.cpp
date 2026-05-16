#include "BTree.h"
#include <QJsonArray>
#include <climits>
#include <algorithm>

BTree::BTree(int degree) : minDegree(degree) {
    if (degree < 2) minDegree = 2;
}

void BTree::setDegree(int degree) {
    if (degree >= 2) {
        minDegree = degree;
        clear();
    }
}

void BTree::insert(int key, std::function<void(const OperationStep&)> stepCallback) {
    if (!root) {
        root = std::make_shared<BTreeNode>(minDegree, true);
        root->keys.push_back(key);

        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::Insert;
            step.node = root;
            step.key = key;
            step.keyIndex = 0;
            step.explanation = QString("Tree was empty. Created root node with key %1.").arg(key);
            stepCallback(step);
        }
        return;
    }

    if (stepCallback) {
        OperationStep step;
        step.type = OperationStep::Type::Traverse;
        step.node = root;
        step.key = key;
        step.keyIndex = -1;
        step.explanation = QString("Starting insertion of key %1 from root.").arg(key);
        stepCallback(step);
    }

    if (root->isFull()) {
        auto newRoot = std::make_shared<BTreeNode>(minDegree, false);
        newRoot->children.push_back(root);
        newRoot->splitChild(0, root);

        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::Split;
            step.node = newRoot;
            step.key = key;
            step.keyIndex = 0;
            step.explanation = QString(
                "Root node was full (%1 keys = max allowed %2).\n"
                "Splitting root: middle key '%3' promoted to new root.\n"
                "Original node split into two balanced children."
            ).arg(root->keys.size())
             .arg(root->maxKeys())
             .arg(newRoot->keys[0]);
            step.affectedNodes = {newRoot, newRoot->children[0], newRoot->children[1]};
            stepCallback(step);
        }

        int i = 0;
        if (newRoot->keys[0] < key) i++;
        newRoot->children[i]->insertNonFull(key);
        root = newRoot;
    } else {
        root->insertNonFull(key);
    }

    if (stepCallback) {
        OperationStep step;
        step.type = OperationStep::Type::Insert;
        step.node = root;
        step.key = key;
        step.explanation = QString("Key %1 successfully inserted into the B-Tree.").arg(key);
        stepCallback(step);
    }
}

bool BTree::remove(int key, std::function<void(const OperationStep&)> stepCallback) {
    if (!root) {
        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::NotFound;
            step.key = key;
            step.explanation = QString("Tree is empty. Key %1 not found.").arg(key);
            stepCallback(step);
        }
        return false;
    }

    if (stepCallback) {
        OperationStep step;
        step.type = OperationStep::Type::Traverse;
        step.node = root;
        step.key = key;
        step.explanation = QString("Starting deletion of key %1 from root.").arg(key);
        stepCallback(step);
    }

    // Check if key exists first
    bool found = false;
    std::function<void(std::shared_ptr<BTreeNode>)> checkKey = 
        [&](std::shared_ptr<BTreeNode> node) {
            if (!node) return;
            int idx = node->findKey(key);
            if (idx < static_cast<int>(node->keys.size()) && node->keys[idx] == key) {
                found = true;
                return;
            }
            if (!node->isLeaf) {
                checkKey(node->children[idx]);
            }
        };
    checkKey(root);

    if (!found) {
        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::NotFound;
            step.key = key;
            step.explanation = QString("Key %1 not found in the B-Tree.").arg(key);
            stepCallback(step);
        }
        return false;
    }

    root->removeKey(key);

    if (root->keys.empty()) {
        if (root->isLeaf) {
            root = nullptr;
        } else {
            root = root->children[0];
        }

        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::Delete;
            step.key = key;
            step.explanation = QString(
                "Root became empty after deletion. "
                "Tree height decreased by 1."
            );
            stepCallback(step);
        }
    } else {
        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::Delete;
            step.key = key;
            step.node = root;
            step.explanation = QString("Key %1 successfully removed from the B-Tree.").arg(key);
            stepCallback(step);
        }
    }

    return true;
}

bool BTree::search(int key, std::function<void(const OperationStep&)> stepCallback) {
    if (!root) {
        if (stepCallback) {
            OperationStep step;
            step.type = OperationStep::Type::NotFound;
            step.key = key;
            step.explanation = "Tree is empty.";
            stepCallback(step);
        }
        return false;
    }

    bool found = false;
    searchHelper(root, key, stepCallback);
    return found;
}

void BTree::searchHelper(std::shared_ptr<BTreeNode> node, int key,
                          std::function<void(const OperationStep&)>& cb) {
    if (!node) return;

    if (cb) {
        OperationStep step;
        step.type = OperationStep::Type::Traverse;
        step.node = node;
        step.key = key;
        step.explanation = QString(
            "Visiting node %1.\nSearching for key %2..."
        ).arg(node->toString()).arg(key);
        cb(step);
    }

    int i = 0;
    while (i < static_cast<int>(node->keys.size()) && key > node->keys[i]) {
        i++;
    }

    if (i < static_cast<int>(node->keys.size()) && node->keys[i] == key) {
        if (cb) {
            OperationStep step;
            step.type = OperationStep::Type::Found;
            step.node = node;
            step.key = key;
            step.keyIndex = i;
            step.explanation = QString(
                "✓ Key %1 found at position %2 in node %3!"
            ).arg(key).arg(i).arg(node->toString());
            cb(step);
        }
        return;
    }

    if (node->isLeaf) {
        if (cb) {
            OperationStep step;
            step.type = OperationStep::Type::NotFound;
            step.key = key;
            step.explanation = QString(
                "✗ Reached leaf node. Key %1 not found in tree."
            ).arg(key);
            cb(step);
        }
        return;
    }

    searchHelper(node->children[i], key, cb);
}

int BTree::getHeight() const {
    return getHeightHelper(root);
}

int BTree::getHeightHelper(std::shared_ptr<BTreeNode> node) const {
    if (!node) return 0;
    if (node->isLeaf) return 1;
    return 1 + getHeightHelper(node->children[0]);
}

int BTree::getNodeCount() const {
    return getNodeCountHelper(root);
}

int BTree::getNodeCountHelper(std::shared_ptr<BTreeNode> node) const {
    if (!node) return 0;
    int count = 1;
    for (auto& child : node->children) {
        count += getNodeCountHelper(child);
    }
    return count;
}

int BTree::getKeyCount() const {
    return getKeyCountHelper(root);
}

int BTree::getKeyCountHelper(std::shared_ptr<BTreeNode> node) const {
    if (!node) return 0;
    int count = static_cast<int>(node->keys.size());
    for (auto& child : node->children) {
        count += getKeyCountHelper(child);
    }
    return count;
}

void BTree::clear() {
    root = nullptr;
}

QJsonObject BTree::toJson() const {
    QJsonObject obj;
    obj["degree"] = minDegree;
    if (root) {
        obj["root"] = nodeToJson(root);
    }
    return obj;
}

QJsonObject BTree::nodeToJson(std::shared_ptr<BTreeNode> node) const {
    QJsonObject obj;
    QJsonArray keysArr;
    for (int k : node->keys) keysArr.append(k);
    obj["keys"] = keysArr;
    obj["isLeaf"] = node->isLeaf;

    QJsonArray childrenArr;
    for (auto& child : node->children) {
        childrenArr.append(nodeToJson(child));
    }
    obj["children"] = childrenArr;
    return obj;
}

void BTree::fromJson(const QJsonObject& json) {
    clear();
    if (json.contains("degree")) {
        minDegree = json["degree"].toInt();
    }
    if (json.contains("root")) {
        root = nodeFromJson(json["root"].toObject());
    }
}

std::shared_ptr<BTreeNode> BTree::nodeFromJson(const QJsonObject& json) const {
    bool isLeaf = json["isLeaf"].toBool();
    auto node = std::make_shared<BTreeNode>(minDegree, isLeaf);

    QJsonArray keysArr = json["keys"].toArray();
    for (auto k : keysArr) {
        node->keys.push_back(k.toInt());
    }

    QJsonArray childrenArr = json["children"].toArray();
    for (auto c : childrenArr) {
        node->children.push_back(nodeFromJson(c.toObject()));
    }

    return node;
}

bool BTree::isValid() const {
    if (!root) return true;
    int leafLevel = getHeight() - 1;
    return isValidHelper(root, INT_MIN, INT_MAX, 0, leafLevel);
}

bool BTree::isValidHelper(std::shared_ptr<BTreeNode> node, int minKey, int maxKey,
                           int level, int leafLevel) const {
    if (!node) return true;

    // Check key count
    if (node != root || !node->isLeaf) {
        if (static_cast<int>(node->keys.size()) < node->minKeys() && node != root) return false;
    }
    if (static_cast<int>(node->keys.size()) > node->maxKeys()) return false;

    // Check key ordering
    for (int i = 0; i < static_cast<int>(node->keys.size()) - 1; i++) {
        if (node->keys[i] >= node->keys[i + 1]) return false;
    }

    // Check bounds
    if (!node->keys.empty()) {
        if (node->keys.front() <= minKey || node->keys.back() >= maxKey) return false;
    }

    // Check leaf level consistency
    if (node->isLeaf && level != leafLevel) return false;
    if (!node->isLeaf && level == leafLevel) return false;

    // Recurse
    for (int i = 0; i < static_cast<int>(node->children.size()); i++) {
        int lo = (i == 0) ? minKey : node->keys[i - 1];
        int hi = (i == static_cast<int>(node->keys.size())) ? maxKey : node->keys[i];
        if (!isValidHelper(node->children[i], lo, hi, level + 1, leafLevel)) return false;
    }

    return true;
}