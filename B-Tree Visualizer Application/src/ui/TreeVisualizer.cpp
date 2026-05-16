#include "TreeVisualizer.h"
#include "../utils/StyleManager.h"
#include <QPainter>
#include <QGraphicsSceneMouseEvent>
#include <QWheelEvent>
#include <QScrollBar>
#include <QScreen>
#include <QGuiApplication>
#include <QImageWriter>
#include <QPainterPath>
#include <QtMath>
#include <QPropertyAnimation>
#include <QGraphicsDropShadowEffect>

// ==================== NodeItem ====================

NodeItem::NodeItem(std::shared_ptr<BTreeNode> node, QGraphicsItem* parent)
    : QGraphicsObject(parent)
    , treeNode(node)
    , highlighted(false)
    , hovered(false)
    , glowEnabled(false)
    , highlightColor(StyleManager::instance().primaryColor())
    , flashingKeyIndex(-1)
    , opacity_(1.0)
{
    if (node) currentKeys = node->keys;
    setAcceptHoverEvents(true);
    setFlag(QGraphicsItem::ItemIsSelectable, true);
    setCacheMode(QGraphicsItem::DeviceCoordinateCache);
}

int NodeItem::getNodeWidth() const {
    int numKeys = static_cast<int>(currentKeys.size());
    return std::max(numKeys * KEY_WIDTH + 2 * PADDING, 80);
}

QRectF NodeItem::boundingRect() const {
    int w = getNodeWidth();
    return QRectF(-w / 2.0, -NODE_HEIGHT / 2.0, w, NODE_HEIGHT);
}

void NodeItem::paint(QPainter* painter, const QStyleOptionGraphicsItem*, QWidget*) {
    painter->setRenderHint(QPainter::Antialiasing, true);
    painter->setRenderHint(QPainter::TextAntialiasing, true);

    auto& sm = StyleManager::instance();
    int w = getNodeWidth();
    QRectF rect(-w / 2.0, -NODE_HEIGHT / 2.0, w, NODE_HEIGHT);

    // Shadow effect when highlighted
    if (highlighted || hovered) {
        painter->save();
        QColor shadowColor = highlighted ? highlightColor : sm.primaryColor();
        shadowColor.setAlpha(80);
        for (int i = 3; i >= 1; i--) {
            painter->setPen(Qt::NoPen);
            painter->setBrush(shadowColor);
            QRectF shadowRect = rect.adjusted(-i * 2, -i * 2, i * 2, i * 2);
            painter->drawRoundedRect(shadowRect, BORDER_RADIUS + i, BORDER_RADIUS + i);
            shadowColor.setAlpha(shadowColor.alpha() / 2);
        }
        painter->restore();
    }

    // Node background
    QLinearGradient gradient(rect.topLeft(), rect.bottomLeft());
    if (highlighted) {
        QColor c1 = highlightColor.darker(120);
        QColor c2 = highlightColor;
        c1.setAlpha(220);
        c2.setAlpha(220);
        gradient.setColorAt(0, c1);
        gradient.setColorAt(1, c2);
    } else if (hovered) {
        gradient.setColorAt(0, sm.nodeColor().lighter(130));
        gradient.setColorAt(1, sm.nodeColor().lighter(110));
    } else {
        gradient.setColorAt(0, sm.nodeColor().lighter(110));
        gradient.setColorAt(1, sm.nodeColor());
    }

    painter->setPen(Qt::NoPen);
    painter->setBrush(gradient);
    painter->drawRoundedRect(rect, BORDER_RADIUS, BORDER_RADIUS);

    // Border
    QColor borderColor = highlighted ? highlightColor : (hovered ? sm.primaryColor() : sm.borderColor());
    painter->setPen(QPen(borderColor, highlighted ? 2.5 : 1.5));
    painter->setBrush(Qt::NoBrush);
    painter->drawRoundedRect(rect.adjusted(0.5, 0.5, -0.5, -0.5), BORDER_RADIUS, BORDER_RADIUS);

    // Draw keys
    int numKeys = static_cast<int>(currentKeys.size());
    if (numKeys == 0) return;

    double keyW = static_cast<double>(w) / numKeys;
    QFont keyFont = sm.nodeFont();
    keyFont.setPointSize(12);
    painter->setFont(keyFont);

    for (int i = 0; i < numKeys; i++) {
        double kx = rect.left() + i * keyW;
        QRectF keyRect(kx, rect.top(), keyW, NODE_HEIGHT);

        // Divider between keys
        if (i > 0) {
            painter->setPen(QPen(sm.borderColor(), 1));
            painter->drawLine(QPointF(kx, rect.top() + 8), QPointF(kx, rect.bottom() - 8));
        }

        // Key flash highlight
        if (i == flashingKeyIndex) {
            painter->setPen(Qt::NoPen);
            painter->setBrush(sm.warningColor().lighter(150));
            painter->drawRoundedRect(keyRect.adjusted(4, 4, -4, -4), 6, 6);
        }

        // Key text
        QColor textColor = highlighted ? Qt::white : sm.textColor();
        if (i == flashingKeyIndex) textColor = Qt::black;
        painter->setPen(textColor);
        painter->drawText(keyRect, Qt::AlignCenter, QString::number(currentKeys[i]));
    }
}

void NodeItem::setHighlighted(bool h, QColor color) {
    highlighted = h;
    highlightColor = color;
    update();
}

void NodeItem::setKeys(const std::vector<int>& keys) {
    currentKeys = keys;
    prepareGeometryChange();
    update();
}

void NodeItem::hoverEnterEvent(QGraphicsSceneHoverEvent*) {
    hovered = true;
    setZValue(10);
    update();
}

void NodeItem::hoverLeaveEvent(QGraphicsSceneHoverEvent*) {
    hovered = false;
    setZValue(0);
    update();
}

void NodeItem::mousePressEvent(QGraphicsSceneMouseEvent*) {
    emit nodeClicked(treeNode);
}

void NodeItem::flashKey(int keyIndex) {
    flashingKeyIndex = keyIndex;
    update();

    QTimer::singleShot(800, this, [this]() {
        flashingKeyIndex = -1;
        update();
    });
}

void NodeItem::animateAppear() {
    setScale(0.0);
    setOpacity(0.0);

    auto* scaleAnim = new QPropertyAnimation(this, "scale");
    scaleAnim->setDuration(350);
    scaleAnim->setStartValue(0.0);
    scaleAnim->setEndValue(1.0);
    scaleAnim->setEasingCurve(QEasingCurve::OutBack);
    scaleAnim->start(QAbstractAnimation::DeleteWhenStopped);

    auto* opAnim = new QPropertyAnimation(this, "opacity");
    opAnim->setDuration(300);
    opAnim->setStartValue(0.0);
    opAnim->setEndValue(1.0);
    opAnim->start(QAbstractAnimation::DeleteWhenStopped);
}

void NodeItem::animateSplit() {
    setHighlighted(true, StyleManager::instance().nodeSplitColor());

    QTimer::singleShot(1000, this, [this]() {
        setHighlighted(false);
    });
}

void NodeItem::animateMerge() {
    setHighlighted(true, StyleManager::instance().warningColor());

    QTimer::singleShot(1000, this, [this]() {
        setHighlighted(false);
    });
}

// ==================== EdgeItem ====================

EdgeItem::EdgeItem(NodeItem* parent, NodeItem* child, QGraphicsItem* parentItem)
    : QGraphicsItem(parentItem)
    , parentNode(parent)
    , childNode(child)
    , highlighted(false)
    , animated(false)
    , edgeColor(StyleManager::instance().edgeColor())
    , animOffset(0)
{
    setZValue(-1);
}

QRectF EdgeItem::boundingRect() const {
    if (!parentNode || !childNode) return QRectF();

    QPointF p = parentNode->scenePos();
    QPointF c = childNode->scenePos();

    double minX = std::min(p.x(), c.x()) - 20;
    double minY = std::min(p.y(), c.y()) - 20;
    double maxX = std::max(p.x(), c.x()) + 20;
    double maxY = std::max(p.y(), c.y()) + 20;

    return QRectF(minX, minY, maxX - minX, maxY - minY);
}

void EdgeItem::paint(QPainter* painter, const QStyleOptionGraphicsItem*, QWidget*) {
    if (!parentNode || !childNode) return;

    painter->setRenderHint(QPainter::Antialiasing, true);

    QPointF p = parentNode->scenePos();
    QPointF c = childNode->scenePos();

    // Offset from center of node
    p.ry() += NodeItem::NODE_HEIGHT / 2.0;
    c.ry() -= NodeItem::NODE_HEIGHT / 2.0;

    // Bezier curve for smooth edges
    QPainterPath path;
    path.moveTo(p);

    double midY = (p.y() + c.y()) / 2.0;
    QPointF cp1(p.x(), midY);
    QPointF cp2(c.x(), midY);
    path.cubicTo(cp1, cp2, c);

    QColor color = highlighted ? StyleManager::instance().primaryColor() : edgeColor;
    painter->setPen(QPen(color, highlighted ? 2.5 : 1.5, Qt::SolidLine, Qt::RoundCap));
    painter->drawPath(path);

    // Arrow at end
    QPointF dir = c - QPointF(c.x(), midY);
    double angle = std::atan2(dir.y(), dir.x());
    double arrowSize = 8;

    QPointF arrowP1 = c + QPointF(std::cos(angle + M_PI * 5.0 / 6.0) * arrowSize,
                                    std::sin(angle + M_PI * 5.0 / 6.0) * arrowSize);
    QPointF arrowP2 = c + QPointF(std::cos(angle - M_PI * 5.0 / 6.0) * arrowSize,
                                    std::sin(angle - M_PI * 5.0 / 6.0) * arrowSize);

    painter->setBrush(color);
    painter->setPen(Qt::NoPen);
    QPolygonF arrow;
    arrow << c << arrowP1 << arrowP2;
    painter->drawPolygon(arrow);
}

void EdgeItem::setHighlighted(bool h, QColor color) {
    highlighted = h;
    edgeColor = h ? color : StyleManager::instance().edgeColor();
    update();
}

// ==================== TreeVisualizer ====================

TreeVisualizer::TreeVisualizer(QWidget* parent)
    : QGraphicsView(parent)
    , btree(nullptr)
    , showGridLines(true)
    , isDark(true)
    , scaleFactor(1.0)
    , panning(false)
    , animTime(0)
{
    scene_ = new QGraphicsScene(this);
    setScene(scene_);

    setRenderHints(QPainter::Antialiasing |
                   QPainter::TextAntialiasing |
                   QPainter::SmoothPixmapTransform);

    setHorizontalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setVerticalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setTransformationAnchor(QGraphicsView::AnchorUnderMouse);
    setResizeAnchor(QGraphicsView::AnchorViewCenter);
    setDragMode(QGraphicsView::NoDrag);
    setViewportUpdateMode(QGraphicsView::FullViewportUpdate);

    setMinimumSize(400, 300);

    // Animation timer for edge animations
    animTimer = new QTimer(this);
    animTimer->setInterval(16); // ~60 FPS
    connect(animTimer, &QTimer::timeout, this, [this]() {
        animTime += 0.016;
        scene_->update();
    });
    animTimer->start();

    setStyleSheet("background: transparent; border: none;");
}

void TreeVisualizer::setTree(BTree* tree) {
    btree = tree;
    refresh();
}

void TreeVisualizer::refresh() {
    clearScene();
    if (!btree || btree->isEmpty()) {
        scene_->setSceneRect(-500, -300, 1000, 600);
        return;
    }
    buildScene();
    resetView();
}

void TreeVisualizer::clearScene() {
    scene_->clear();
    nodeItems.clear();
    edgeItems.clear();
}

void TreeVisualizer::buildScene() {
    if (!btree || !btree->getRoot()) return;

    std::vector<NodeLayout> layouts;
    double totalWidth = calculateSubtreeWidth(btree->getRoot());
    calculateLayout(btree->getRoot(), 0, 0, totalWidth, layouts, 0);

    // Create node items
    for (auto& layout : layouts) {
        createNodeItem(layout.node, layout.x, layout.y);
    }

    // Create edges
    std::function<void(std::shared_ptr<BTreeNode>)> createEdges =
        [&](std::shared_ptr<BTreeNode> node) {
            if (!node || node->isLeaf) return;
            NodeItem* parentItem = nodeItems.count(node.get()) ? nodeItems[node.get()] : nullptr;
            if (!parentItem) return;

            for (auto& child : node->children) {
                NodeItem* childItem = nodeItems.count(child.get()) ? nodeItems[child.get()] : nullptr;
                if (childItem) {
                    createEdgeItem(parentItem, childItem);
                }
                createEdges(child);
            }
        };

    createEdges(btree->getRoot());

    // Update scene rect
    QRectF br = scene_->itemsBoundingRect();
    scene_->setSceneRect(br.adjusted(-100, -80, 100, 80));
}

void TreeVisualizer::calculateLayout(std::shared_ptr<BTreeNode> node,
                                      double x, double y, double availableWidth,
                                      std::vector<NodeLayout>& layouts, int depth) {
    if (!node) return;

    NodeLayout layout;
    layout.node = node;
    layout.x = x;
    layout.y = y;
    layout.subtreeWidth = availableWidth;
    layouts.push_back(layout);

    if (node->isLeaf || node->children.empty()) return;

    int numChildren = static_cast<int>(node->children.size());
    double childWidth = availableWidth / numChildren;
    double startX = x - availableWidth / 2.0 + childWidth / 2.0;

    for (int i = 0; i < numChildren; i++) {
        calculateLayout(node->children[i],
                       startX + i * childWidth,
                       y + LEVEL_HEIGHT,
                       childWidth - MIN_SIBLING_SPACING,
                       layouts, depth + 1);
    }
}

double TreeVisualizer::calculateSubtreeWidth(std::shared_ptr<BTreeNode> node) const {
    if (!node) return 0;
    if (node->isLeaf || node->children.empty()) {
        int numKeys = static_cast<int>(node->keys.size());
        return std::max(numKeys * NodeItem::KEY_WIDTH + 2 * NodeItem::PADDING + 40.0, 120.0);
    }

    double totalChildWidth = 0;
    for (auto& child : node->children) {
        totalChildWidth += calculateSubtreeWidth(child) + MIN_SIBLING_SPACING;
    }
    return totalChildWidth;
}

void TreeVisualizer::createNodeItem(std::shared_ptr<BTreeNode> node, double x, double y) {
    auto* item = new NodeItem(node);
    item->setPos(x, y);
    item->setKeys(node->keys);
    scene_->addItem(item);
    nodeItems[node.get()] = item;

    item->animateAppear();

    connect(item, &NodeItem::nodeClicked, this, [this](std::shared_ptr<BTreeNode> n) {
        emit nodeSelected(n);
    });
}

void TreeVisualizer::createEdgeItem(NodeItem* parent, NodeItem* child) {
    auto* edge = new EdgeItem(parent, child);
    scene_->addItem(edge);
    edgeItems.push_back(edge);
}

void TreeVisualizer::highlightNode(std::shared_ptr<BTreeNode> node, QColor color) {
    auto it = nodeItems.find(node.get());
    if (it != nodeItems.end()) {
        it->second->setHighlighted(true, color);
    }
}

void TreeVisualizer::highlightPath(const std::vector<std::shared_ptr<BTreeNode>>& path) {
    clearHighlights();
    auto& sm = StyleManager::instance();
    for (size_t i = 0; i < path.size(); i++) {
        auto it = nodeItems.find(path[i].get());
        if (it != nodeItems.end()) {
            QColor color = (i == path.size() - 1) ?
                sm.successColor() : sm.nodeSearchColor();
            it->second->setHighlighted(true, color);
        }
    }
}

void TreeVisualizer::clearHighlights() {
    for (auto& [node, item] : nodeItems) {
        item->setHighlighted(false);
    }
    for (auto* edge : edgeItems) {
        edge->setHighlighted(false);
    }
}

void TreeVisualizer::showGrid(bool show) {
    showGridLines = show;
    scene_->update();
}

void TreeVisualizer::resetView() {
    fitInView(scene_->sceneRect(), Qt::KeepAspectRatio);
    double currentScale = transform().m11();
    if (currentScale > 1.2) {
        resetTransform();
        scale(1.0, 1.0);
    }
}

void TreeVisualizer::zoomIn() {
    if (scaleFactor < 3.0) {
        scale(1.2, 1.2);
        scaleFactor *= 1.2;
    }
}

void TreeVisualizer::zoomOut() {
    if (scaleFactor > 0.2) {
        scale(1.0 / 1.2, 1.0 / 1.2);
        scaleFactor /= 1.2;
    }
}

void TreeVisualizer::wheelEvent(QWheelEvent* event) {
    double factor = event->angleDelta().y() > 0 ? 1.15 : (1.0 / 1.15);
    double newScale = scaleFactor * factor;

    if (newScale >= 0.1 && newScale <= 5.0) {
        scale(factor, factor);
        scaleFactor = newScale;
    }
    event->accept();
}

void TreeVisualizer::mousePressEvent(QMouseEvent* event) {
    if (event->button() == Qt::MiddleButton ||
        (event->button() == Qt::LeftButton && event->modifiers() & Qt::AltModifier)) {
        panning = true;
        lastPanPoint = event->pos();
        setCursor(Qt::ClosedHandCursor);
        event->accept();
        return;
    }
    QGraphicsView::mousePressEvent(event);
}

void TreeVisualizer::mouseMoveEvent(QMouseEvent* event) {
    if (panning) {
        QPoint delta = event->pos() - lastPanPoint;
        horizontalScrollBar()->setValue(horizontalScrollBar()->value() - delta.x());
        verticalScrollBar()->setValue(verticalScrollBar()->value() - delta.y());
        lastPanPoint = event->pos();
        event->accept();
        return;
    }
    QGraphicsView::mouseMoveEvent(event);
}

void TreeVisualizer::mouseReleaseEvent(QMouseEvent* event) {
    if (panning) {
        panning = false;
        setCursor(Qt::ArrowCursor);
        event->accept();
        return;
    }
    QGraphicsView::mouseReleaseEvent(event);
}

void TreeVisualizer::resizeEvent(QResizeEvent* event) {
    QGraphicsView::resizeEvent(event);
}

void TreeVisualizer::drawBackground(QPainter* painter, const QRectF& rect) {
    auto& sm = StyleManager::instance();

    // Background
    painter->fillRect(rect, sm.backgroundColor());

    if (showGridLines) {
        painter->setPen(QPen(sm.gridColor(), 0.5));
        double gridSize = 40.0;

        double startX = std::floor(rect.left() / gridSize) * gridSize;
        double startY = std::floor(rect.top() / gridSize) * gridSize;

        for (double x = startX; x <= rect.right(); x += gridSize) {
            painter->drawLine(QPointF(x, rect.top()), QPointF(x, rect.bottom()));
        }
        for (double y = startY; y <= rect.bottom(); y += gridSize) {
            painter->drawLine(QPointF(rect.left(), y), QPointF(rect.right(), y));
        }

        // Dots at intersections
        painter->setPen(Qt::NoPen);
        painter->setBrush(sm.gridColor().lighter(120));
        for (double x = startX; x <= rect.right(); x += gridSize) {
            for (double y = startY; y <= rect.bottom(); y += gridSize) {
                painter->drawEllipse(QPointF(x, y), 1.5, 1.5);
            }
        }
    }
}

void TreeVisualizer::setTheme(bool dark) {
    isDark = dark;
    scene_->update();
}

void TreeVisualizer::exportAsImage(const QString& filename) {
    QRectF bounds = scene_->itemsBoundingRect().adjusted(-50, -50, 50, 50);
    QImage image(bounds.size().toSize() * 2, QImage::Format_ARGB32_Premultiplied);
    image.fill(StyleManager::instance().backgroundColor());

    QPainter painter(&image);
    painter.setRenderHints(QPainter::Antialiasing | QPainter::TextAntialiasing |
                           QPainter::SmoothPixmapTransform);
    scene_->render(&painter, QRectF(), bounds);
    painter.end();

    image.save(filename);
}

void TreeVisualizer::animateNodeSplit(std::shared_ptr<BTreeNode> node) {
    auto it = nodeItems.find(node.get());
    if (it != nodeItems.end()) {
        it->second->animateSplit();
    }
}

void TreeVisualizer::animateNodeMerge(std::shared_ptr<BTreeNode> n1,
                                       std::shared_ptr<BTreeNode> n2) {
    auto it1 = nodeItems.find(n1.get());
    auto it2 = nodeItems.find(n2.get());
    if (it1 != nodeItems.end()) it1->second->animateMerge();
    if (it2 != nodeItems.end()) it2->second->animateMerge();
}