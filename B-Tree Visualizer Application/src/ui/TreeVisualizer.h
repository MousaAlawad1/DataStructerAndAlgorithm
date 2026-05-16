#pragma once
#include <QWidget>
#include <QGraphicsView>
#include <QGraphicsScene>
#include <QGraphicsItem>
#include <QTimer>
#include <QPainter>
#include <QWheelEvent>
#include <memory>
#include <map>
#include "../btree/BTree.h"
#include "../animation/AnimationController.h"

// Visual representation of a node
class NodeItem : public QGraphicsObject {
    Q_OBJECT

public:
    explicit NodeItem(std::shared_ptr<BTreeNode> node, QGraphicsItem* parent = nullptr);

    QRectF boundingRect() const override;
    void paint(QPainter* painter, const QStyleOptionGraphicsItem* option,
               QWidget* widget) override;

    void setHighlighted(bool h, QColor color = QColor("#6C63FF"));
    void setKeys(const std::vector<int>& keys);
    void animateAppear();
    void animateSplit();
    void animateMerge();
    void flashKey(int keyIndex);
    void setGlowEffect(bool enabled, QColor color = QColor("#6C63FF"));

    std::shared_ptr<BTreeNode> treeNode;
    static const int NODE_HEIGHT = 52;
    static const int KEY_WIDTH = 48;
    static const int PADDING = 16;
    static const int BORDER_RADIUS = 10;

signals:
    void nodeClicked(std::shared_ptr<BTreeNode> node);

protected:
    void mousePressEvent(QGraphicsSceneMouseEvent* event) override;
    void hoverEnterEvent(QGraphicsSceneHoverEvent* event) override;
    void hoverLeaveEvent(QGraphicsSceneHoverEvent* event) override;

private:
    bool highlighted;
    bool hovered;
    bool glowEnabled;
    QColor highlightColor;
    QColor glowColor;
    std::vector<int> currentKeys;
    int flashingKeyIndex;
    double opacity_;

    int getNodeWidth() const;
};

// Visual edge between nodes
class EdgeItem : public QGraphicsItem {
public:
    EdgeItem(NodeItem* parent, NodeItem* child, QGraphicsItem* parentItem = nullptr);

    QRectF boundingRect() const override;
    void paint(QPainter* painter, const QStyleOptionGraphicsItem* option,
               QWidget* widget) override;

    void updatePositions();
    void setHighlighted(bool h, QColor color = QColor("#6C63FF"));
    void setAnimated(bool a);

private:
    NodeItem* parentNode;
    NodeItem* childNode;
    bool highlighted;
    bool animated;
    QColor edgeColor;
    double animOffset;
};

class TreeVisualizer : public QGraphicsView {
    Q_OBJECT

public:
    explicit TreeVisualizer(QWidget* parent = nullptr);

    void setTree(BTree* tree);
    void refresh();
    void highlightNode(std::shared_ptr<BTreeNode> node, QColor color);
    void highlightPath(const std::vector<std::shared_ptr<BTreeNode>>& path);
    void clearHighlights();
    void showGrid(bool show);
    void resetView();
    void zoomIn();
    void zoomOut();
    void exportAsImage(const QString& filename);
    void setTheme(bool dark);
    void animateNodeSplit(std::shared_ptr<BTreeNode> node);
    void animateNodeMerge(std::shared_ptr<BTreeNode> node1, std::shared_ptr<BTreeNode> node2);

    QGraphicsScene* getScene() const { return scene_; }

signals:
    void nodeSelected(std::shared_ptr<BTreeNode> node);
    void viewportChanged();

protected:
    void wheelEvent(QWheelEvent* event) override;
    void mousePressEvent(QMouseEvent* event) override;
    void mouseMoveEvent(QMouseEvent* event) override;
    void mouseReleaseEvent(QMouseEvent* event) override;
    void resizeEvent(QResizeEvent* event) override;
    void drawBackground(QPainter* painter, const QRectF& rect) override;

private:
    QGraphicsScene* scene_;
    BTree* btree;
    bool showGridLines;
    bool isDark;
    double scaleFactor;

    // Node mapping
    std::map<BTreeNode*, NodeItem*> nodeItems;
    std::vector<EdgeItem*> edgeItems;

    // Pan support
    bool panning;
    QPoint lastPanPoint;

    // Layout
    struct NodeLayout {
        std::shared_ptr<BTreeNode> node;
        double x, y;
        double subtreeWidth;
    };

    // Animation timer
    QTimer* animTimer;
    double animTime;

    void buildScene();
    void clearScene();
    void layoutTree();
    void calculateLayout(std::shared_ptr<BTreeNode> node,
                         double x, double y, double availableWidth,
                         std::vector<NodeLayout>& layouts,
                         int depth);
    double calculateSubtreeWidth(std::shared_ptr<BTreeNode> node) const;

    void createNodeItem(std::shared_ptr<BTreeNode> node, double x, double y);
    void createEdgeItem(NodeItem* parent, NodeItem* child);
    void updateEdges();

    static const int LEVEL_HEIGHT = 120;
    static const int MIN_SIBLING_SPACING = 20;
};