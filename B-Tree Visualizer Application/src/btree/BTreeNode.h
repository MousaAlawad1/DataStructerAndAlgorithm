#pragma once
#include <vector>
#include <memory>
#include <QString>
#include <QPointF>
class BTreeNode {
public:
    std::vector<int> keys;
    std::vector<std::shared_ptr<BTreeNode>> children;
    bool isLeaf;
    int minDegree; // minimum degree t

    // Visual state
    mutable QPointF position;
    mutable QPointF targetPosition;
    mutable bool highlighted;
    mutable bool splitting;
    mutable bool merging;
    mutable bool searchHighlight;
    mutable int highlightedKeyIndex;
    mutable double animProgress; // 0.0 to 1.0

    explicit BTreeNode(int t, bool leaf);
    ~BTreeNode() = default;

    // Tree operations
    void insertNonFull(int key);
    void splitChild(int i, std::shared_ptr<BTreeNode> child);

    // Utility
    int findKey(int key) const;
    void removeFromLeaf(int idx);
    void removeFromNonLeaf(int idx);
    int getPredecessor(int idx) const;
    int getSuccessor(int idx) const;
    void removeKey(int key);
    void fill(int idx);
    void borrowFromPrev(int idx);
    void borrowFromNext(int idx);
    void merge(int idx);

    // State
    bool isFull() const;
    int maxKeys() const;
    int minKeys() const;
    QString toString() const;
};