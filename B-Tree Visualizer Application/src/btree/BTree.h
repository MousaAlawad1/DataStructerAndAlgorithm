#pragma once
#include "BTreeNode.h"
#include <functional>
#include <vector>
#include <QString>
#include <QJsonObject>

struct OperationStep {
    enum class Type {
        Traverse,
        Found,
        NotFound,
        Insert,
        Split,
        Delete,
        Merge,
        Borrow,
        Replace,
        Highlight
    };

    Type type;
    std::shared_ptr<BTreeNode> node;
    int keyIndex;
    int key;
    QString explanation;
    std::vector<std::shared_ptr<BTreeNode>> affectedNodes;
};

class BTree {
public:
    explicit BTree(int degree = 3);
    ~BTree() = default;

    // Core operations
    void insert(int key, std::function<void(const OperationStep&)> stepCallback = nullptr);
    bool remove(int key, std::function<void(const OperationStep&)> stepCallback = nullptr);
    bool search(int key, std::function<void(const OperationStep&)> stepCallback = nullptr);
    void clear();

    // Tree properties
    int getHeight() const;
    int getNodeCount() const;
    int getKeyCount() const;
    int getDegree() const { return minDegree; }
    bool isEmpty() const { return root == nullptr; }

    std::shared_ptr<BTreeNode> getRoot() const { return root; }

    // Serialization
    QJsonObject toJson() const;
    void fromJson(const QJsonObject& json);

    // Validation
    bool isValid() const;

    // Degree management
    void setDegree(int degree);

private:
    std::shared_ptr<BTreeNode> root;
    int minDegree;

    // Helper methods
    void searchHelper(std::shared_ptr<BTreeNode> node, int key,
                      std::function<void(const OperationStep&)>& cb);
    int getHeightHelper(std::shared_ptr<BTreeNode> node) const;
    int getNodeCountHelper(std::shared_ptr<BTreeNode> node) const;
    int getKeyCountHelper(std::shared_ptr<BTreeNode> node) const;
    bool isValidHelper(std::shared_ptr<BTreeNode> node, int minKey, int maxKey, int level, int leafLevel) const;

    QJsonObject nodeToJson(std::shared_ptr<BTreeNode> node) const;
    std::shared_ptr<BTreeNode> nodeFromJson(const QJsonObject& json) const;
};