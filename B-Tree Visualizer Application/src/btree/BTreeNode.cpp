#include "BTreeNode.h"
#include <QPointF>
#include <stdexcept>

BTreeNode::BTreeNode(int t, bool leaf)
    : isLeaf(leaf)
    , minDegree(t)
    , highlighted(false)
    , splitting(false)
    , merging(false)
    , searchHighlight(false)
    , highlightedKeyIndex(-1)
    , animProgress(0.0)
{
}

bool BTreeNode::isFull() const {
    return static_cast<int>(keys.size()) == 2 * minDegree - 1;
}

int BTreeNode::maxKeys() const {
    return 2 * minDegree - 1;
}

int BTreeNode::minKeys() const {
    return minDegree - 1;
}

void BTreeNode::insertNonFull(int key) {
    int i = static_cast<int>(keys.size()) - 1;

    if (isLeaf) {
        keys.push_back(0);
        while (i >= 0 && keys[i] > key) {
            keys[i + 1] = keys[i];
            i--;
        }
        keys[i + 1] = key;
    } else {
        while (i >= 0 && keys[i] > key) {
            i--;
        }
        if (children[i + 1]->isFull()) {
            splitChild(i + 1, children[i + 1]);
            if (keys[i + 1] < key) {
                i++;
            }
        }
        children[i + 1]->insertNonFull(key);
    }
}

void BTreeNode::splitChild(int i, std::shared_ptr<BTreeNode> child) {
    int t = minDegree;
    auto newNode = std::make_shared<BTreeNode>(t, child->isLeaf);

    // Copy the last t-1 keys of child to newNode
    for (int j = 0; j < t - 1; j++) {
        newNode->keys.push_back(child->keys[j + t]);
    }

    // Copy the last t children of child to newNode
    if (!child->isLeaf) {
        for (int j = 0; j < t; j++) {
            newNode->children.push_back(child->children[j + t]);
        }
    }

    // Insert newNode as child of this node
    children.insert(children.begin() + i + 1, newNode);

    // Move middle key up
    keys.insert(keys.begin() + i, child->keys[t - 1]);

    // Resize child's keys
    child->keys.resize(t - 1);
    if (!child->isLeaf) {
        child->children.resize(t);
    }
}

int BTreeNode::findKey(int key) const {
    int idx = 0;
    while (idx < static_cast<int>(keys.size()) && keys[idx] < key) {
        idx++;
    }
    return idx;
}

void BTreeNode::removeFromLeaf(int idx) {
    keys.erase(keys.begin() + idx);
}

void BTreeNode::removeFromNonLeaf(int idx) {
    int key = keys[idx];

    if (static_cast<int>(children[idx]->keys.size()) >= minDegree) {
        int pred = getPredecessor(idx);
        keys[idx] = pred;
        children[idx]->removeKey(pred);
    } else if (static_cast<int>(children[idx + 1]->keys.size()) >= minDegree) {
        int succ = getSuccessor(idx);
        keys[idx] = succ;
        children[idx + 1]->removeKey(succ);
    } else {
        merge(idx);
        children[idx]->removeKey(key);
    }
}

int BTreeNode::getPredecessor(int idx) const {
    auto cur = children[idx];
    while (!cur->isLeaf) {
        cur = cur->children.back();
    }
    return cur->keys.back();
}

int BTreeNode::getSuccessor(int idx) const {
    auto cur = children[idx + 1];
    while (!cur->isLeaf) {
        cur = cur->children.front();
    }
    return cur->keys.front();
}

void BTreeNode::fill(int idx) {
    if (idx != 0 && static_cast<int>(children[idx - 1]->keys.size()) >= minDegree) {
        borrowFromPrev(idx);
    } else if (idx != static_cast<int>(keys.size()) &&
               static_cast<int>(children[idx + 1]->keys.size()) >= minDegree) {
        borrowFromNext(idx);
    } else {
        if (idx != static_cast<int>(keys.size())) {
            merge(idx);
        } else {
            merge(idx - 1);
        }
    }
}

void BTreeNode::borrowFromPrev(int idx) {
    auto child = children[idx];
    auto sibling = children[idx - 1];

    child->keys.insert(child->keys.begin(), keys[idx - 1]);

    if (!child->isLeaf) {
        child->children.insert(child->children.begin(), sibling->children.back());
        sibling->children.pop_back();
    }

    keys[idx - 1] = sibling->keys.back();
    sibling->keys.pop_back();
}

void BTreeNode::borrowFromNext(int idx) {
    auto child = children[idx];
    auto sibling = children[idx + 1];

    child->keys.push_back(keys[idx]);

    if (!child->isLeaf) {
        child->children.push_back(sibling->children.front());
        sibling->children.erase(sibling->children.begin());
    }

    keys[idx] = sibling->keys.front();
    sibling->keys.erase(sibling->keys.begin());
}

void BTreeNode::merge(int idx) {
    auto child = children[idx];
    auto sibling = children[idx + 1];

    child->keys.push_back(keys[idx]);

    for (auto& key : sibling->keys) {
        child->keys.push_back(key);
    }

    if (!child->isLeaf) {
        for (auto& c : sibling->children) {
            child->children.push_back(c);
        }
    }

    keys.erase(keys.begin() + idx);
    children.erase(children.begin() + idx + 1);
}

void BTreeNode::removeKey(int key) {
    int idx = findKey(key);

    if (idx < static_cast<int>(keys.size()) && keys[idx] == key) {
        if (isLeaf) {
            removeFromLeaf(idx);
        } else {
            removeFromNonLeaf(idx);
        }
    } else {
        if (isLeaf) return; // Key not found

        bool isLastChild = (idx == static_cast<int>(keys.size()));

        if (static_cast<int>(children[idx]->keys.size()) < minDegree) {
            fill(idx);
        }

        if (isLastChild && idx > static_cast<int>(keys.size())) {
            children[idx - 1]->removeKey(key);
        } else {
            children[idx]->removeKey(key);
        }
    }
}

QString BTreeNode::toString() const {
    QString result = "[";
    for (int i = 0; i < static_cast<int>(keys.size()); i++) {
        if (i > 0) result += "|";
        result += QString::number(keys[i]);
    }
    result += "]";
    return result;
}