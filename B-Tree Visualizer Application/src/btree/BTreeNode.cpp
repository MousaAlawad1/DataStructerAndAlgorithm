#include "BTreeNode.h"
#include <QPointF>
#include <algorithm>

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

// overflow لما يوصل m عناصر
bool BTreeNode::isFull() const {
    return static_cast<int>(keys.size()) >= minDegree;
}

// maxKeys = m - 1
int BTreeNode::maxKeys() const {
    return minDegree - 1;
}

// minKeys = ceil(m/2) - 1
int BTreeNode::minKeys() const {
    return (minDegree + 1) / 2 - 1;
}

void BTreeNode::insertNonFull(int key) {
    if (isLeaf) {
        // أدخل مرتّب
        keys.push_back(key);
        std::sort(keys.begin(), keys.end());
    } else {
        // اختار الـ child المناسب
        int i = 0;
        while (i < static_cast<int>(keys.size()) && key > keys[i]) i++;
        children[i]->insertNonFull(key);
        // لو الـ child صار overflow → split
        if (children[i]->isFull()) {
            splitChild(i, children[i]);
        }
    }
}

void BTreeNode::splitChild(int i, std::shared_ptr<BTreeNode> child) {
    // mid = ceil(m/2) - 1
    // m=4: [3,5,9,21] → mid=1 → يطلع 5 ✅
    // m=4: [7,9,19,21] → mid=1 → يطلع 9 ✅
    int mid = (minDegree + 1) / 2 - 1;

    auto newNode = std::make_shared<BTreeNode>(minDegree, child->isLeaf);

    // newNode يأخذ العناصر بعد الوسطي
    for (int j = mid + 1; j < static_cast<int>(child->keys.size()); j++)
        newNode->keys.push_back(child->keys[j]);

    // نسخ الأبناء إذا مو leaf
    if (!child->isLeaf)
        for (int j = mid + 1; j < static_cast<int>(child->children.size()); j++)
            newNode->children.push_back(child->children[j]);

    // العنصر الوسطي يطلع للأب
    keys.insert(keys.begin() + i, child->keys[mid]);

    // إضافة newNode كابن للأب
    children.insert(children.begin() + i + 1, newNode);

    // child يبقى فقط العناصر قبل الوسطي
    child->keys.resize(mid);
    if (!child->isLeaf)
        child->children.resize(mid + 1);
}

int BTreeNode::findKey(int key) const {
    int idx = 0;
    while (idx < static_cast<int>(keys.size()) && keys[idx] < key)
        idx++;
    return idx;
}

void BTreeNode::removeFromLeaf(int idx) {
    keys.erase(keys.begin() + idx);
}

void BTreeNode::removeFromNonLeaf(int idx) {
    int key = keys[idx];
    int minK = (minDegree + 1) / 2 - 1;

    if (static_cast<int>(children[idx]->keys.size()) > minK) {
        int pred = getPredecessor(idx);
        keys[idx] = pred;
        children[idx]->removeKey(pred);
    } else if (static_cast<int>(children[idx + 1]->keys.size()) > minK) {
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
    while (!cur->isLeaf)
        cur = cur->children.back();
    return cur->keys.back();
}

int BTreeNode::getSuccessor(int idx) const {
    auto cur = children[idx + 1];
    while (!cur->isLeaf)
        cur = cur->children.front();
    return cur->keys.front();
}

void BTreeNode::fill(int idx) {
    int minK = (minDegree + 1) / 2 - 1;

    if (idx != 0 && static_cast<int>(children[idx - 1]->keys.size()) > minK)
        borrowFromPrev(idx);
    else if (idx != static_cast<int>(keys.size()) &&
             static_cast<int>(children[idx + 1]->keys.size()) > minK)
        borrowFromNext(idx);
    else {
        if (idx != static_cast<int>(keys.size()))
            merge(idx);
        else
            merge(idx - 1);
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
    for (auto& k : sibling->keys)
        child->keys.push_back(k);
    if (!child->isLeaf)
        for (auto& c : sibling->children)
            child->children.push_back(c);

    keys.erase(keys.begin() + idx);
    children.erase(children.begin() + idx + 1);
}

void BTreeNode::removeKey(int key) {
    int idx = findKey(key);

    if (idx < static_cast<int>(keys.size()) && keys[idx] == key) {
        if (isLeaf)
            removeFromLeaf(idx);
        else
            removeFromNonLeaf(idx);
    } else {
        if (isLeaf) return;

        bool isLastChild = (idx == static_cast<int>(keys.size()));
        int minK = (minDegree + 1) / 2 - 1;

        if (static_cast<int>(children[idx]->keys.size()) <= minK)
            fill(idx);

        if (isLastChild && idx > static_cast<int>(keys.size()))
            children[idx - 1]->removeKey(key);
        else
            children[idx]->removeKey(key);
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
