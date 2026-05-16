#include "MainWindow.h"
#include <QMenuBar>
#include <QStatusBar>
#include <QFileDialog>
#include <QMessageBox>
#include <QKeyEvent>
#include <QApplication>
#include <QScreen>
#include <QJsonDocument>
#include <QFile>
#include <QRandomGenerator>
#include <QScrollArea>
#include <QFrame>
#include <QVBoxLayout>
#include <QCloseEvent>
#include <QTimer>
#include <QLabel>
#include <algorithm>
#include <set>

// ==================== Undo Commands ====================

InsertCommand::InsertCommand(BTree* tree, int key, TreeVisualizer* viz, InfoPanel* info)
    : QUndoCommand(QString("Insert %1").arg(key))
    , tree(tree), key(key), visualizer(viz), infoPanel(info)
{}

void InsertCommand::undo() {
    tree->remove(key);
    visualizer->refresh();
    if (infoPanel) infoPanel->showExplanation(
            QString("Undid insertion of key %1.").arg(key), "↩ Undo Insert");
}

void InsertCommand::redo() {
    tree->insert(key);
    visualizer->refresh();
    if (infoPanel) infoPanel->showExplanation(
            QString("Redid insertion of key %1.").arg(key), "↪ Redo Insert");
}

DeleteCommand::DeleteCommand(BTree* tree, int key, TreeVisualizer* viz, InfoPanel* info)
    : QUndoCommand(QString("Delete %1").arg(key))
    , tree(tree), key(key), wasSuccessful(false), visualizer(viz), infoPanel(info)
{}

void DeleteCommand::undo() {
    if (wasSuccessful) {
        tree->insert(key);
        visualizer->refresh();
        if (infoPanel) infoPanel->showExplanation(
                QString("Undid deletion of key %1.").arg(key), "↩ Undo Delete");
    }
}

void DeleteCommand::redo() {
    wasSuccessful = tree->remove(key);
    visualizer->refresh();
    if (infoPanel) infoPanel->showExplanation(
            wasSuccessful ?
                QString("Redid deletion of key %1.").arg(key) :
                QString("Key %1 not found for deletion.").arg(key),
            "↪ Redo Delete");
}

// ==================== MainWindow ====================

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent)
    , currentStepIndex(0)
    , stepModeActive(false)
    , animSpeed(1.0)
{
    btree = std::make_unique<BTree>(3);
    animController = new AnimationController(this);
    logger = new OperationLogger(this);
    undoStack = new QUndoStack(this);
    undoStack->setUndoLimit(50);

    stepTimer = new QTimer(this);
    stepTimer->setSingleShot(true);

    setupUI();
    setupMenuBar();
    setupStatusBar();
    setupConnections();
    applyTheme(true);

    // Window setup
    setWindowTitle("B-Tree Visualizer — Professional Edition");
    setMinimumSize(1200, 700);

    // Center on screen
    QScreen* screen = QGuiApplication::primaryScreen();
    QRect geo = screen->availableGeometry();
    resize(geo.width() * 0.88, geo.height() * 0.85);
    move(geo.center() - rect().center());

    showStatusMessage("Welcome to B-Tree Visualizer! Insert keys to get started.", 5000);
}

void MainWindow::setupUI() {
    auto* centralWidget = new QWidget(this);
    setCentralWidget(centralWidget);

    auto* outerLayout = new QVBoxLayout(centralWidget);
    outerLayout->setSpacing(0);
    outerLayout->setContentsMargins(0, 0, 0, 0);

    // Control panel at top
    controlPanel = new ControlPanel(this);
    controlPanel->setFixedHeight(180);
    outerLayout->addWidget(controlPanel);

    // Separator
    auto* sep = new QFrame(this);
    sep->setFrameShape(QFrame::HLine);
    sep->setFixedHeight(1);
    outerLayout->addWidget(sep);

    // Main content area
    mainSplitter = new QSplitter(Qt::Horizontal, this);
    mainSplitter->setHandleWidth(2);

    // Tree visualizer (center)
    treeVisualizer = new TreeVisualizer(this);
    treeVisualizer->setMinimumWidth(600);

    // Info panel (right)
    auto* infoPanelScroll = new QScrollArea(this);
    infoPanel = new InfoPanel(this);
    infoPanelScroll->setWidget(infoPanel);
    infoPanelScroll->setWidgetResizable(true);
    infoPanelScroll->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    infoPanelScroll->setFixedWidth(320);
    infoPanelScroll->setStyleSheet("QScrollArea { border: none; }");

    mainSplitter->addWidget(treeVisualizer);
    mainSplitter->addWidget(infoPanelScroll);
    mainSplitter->setStretchFactor(0, 4);
    mainSplitter->setStretchFactor(1, 1);

    outerLayout->addWidget(mainSplitter, 1);

    treeVisualizer->setTree(btree.get());
    infoPanel->updateTreeStats(btree.get());
}

void MainWindow::setupMenuBar() {
    auto* menuBar = this->menuBar();

    // File menu
    auto* fileMenu = menuBar->addMenu("&File");
    fileMenu->addAction("💾 Save Tree", this, &MainWindow::handleSave,
                        QKeySequence::Save);
    fileMenu->addAction("📂 Load Tree", this, &MainWindow::handleLoad,
                        QKeySequence::Open);
    fileMenu->addSeparator();
    fileMenu->addAction("📷 Export as Image", this, &MainWindow::handleExport,
                        QKeySequence("Ctrl+E"));
    fileMenu->addSeparator();
    fileMenu->addAction("❌ Exit", qApp, &QApplication::quit,
                        QKeySequence::Quit);

    // Edit menu
    auto* editMenu = menuBar->addMenu("&Edit");
    auto* undoAction = undoStack->createUndoAction(this, "↩️ &Undo");
    undoAction->setShortcut(QKeySequence::Undo);
    auto* redoAction = undoStack->createRedoAction(this, "↪️ &Redo");
    redoAction->setShortcut(QKeySequence::Redo);
    editMenu->addAction(undoAction);
    editMenu->addAction(redoAction);
    editMenu->addSeparator();
    editMenu->addAction("🗑️ Clear Tree", this, &MainWindow::handleClear,
                        QKeySequence("Ctrl+Del"));
    editMenu->addAction("🎲 Random Fill", this, [this]() { handleRandom(20); },
                        QKeySequence("Ctrl+R"));

    // View menu
    auto* viewMenu = menuBar->addMenu("&View");
    viewMenu->addAction("🔍 Zoom In", treeVisualizer, &TreeVisualizer::zoomIn,
                        QKeySequence::ZoomIn);
    viewMenu->addAction("🔍 Zoom Out", treeVisualizer, &TreeVisualizer::zoomOut,
                        QKeySequence::ZoomOut);
    viewMenu->addAction("⊡ Reset View", treeVisualizer, &TreeVisualizer::resetView,
                        QKeySequence("Ctrl+0"));

    // Help menu
    auto* helpMenu = menuBar->addMenu("&Help");
    helpMenu->addAction("ℹ️ About", this, [this]() {
        QMessageBox::about(this, "About B-Tree Visualizer",
                           "<h2>B-Tree Visualizer</h2>"
                           "<p>A professional educational tool for visualizing and understanding "
                           "B-Tree data structures.</p>"
                           "<p><b>Features:</b></p>"
                           "<ul>"
                           "<li>Interactive insertion, deletion, and search</li>"
                           "<li>Step-by-step animation mode</li>"
                           "<li>Educational explanations for each operation</li>"
                           "<li>Customizable tree degree</li>"
                           "<li>Undo/Redo support</li>"
                           "<li>Save/Load/Export capabilities</li>"
                           "</ul>"
                           "<p><b>Controls:</b></p>"
                           "<ul>"
                           "<li>Mouse wheel: Zoom</li>"
                           "<li>Alt+Drag or Middle click+Drag: Pan</li>"
                           "<li>Ctrl+Z/Y: Undo/Redo</li>"
                           "</ul>"
                           "<p>Built with Qt6 and C++17</p>");
    });

    helpMenu->addAction("⌨️ Keyboard Shortcuts", this, [this]() {
        QMessageBox::information(this, "Keyboard Shortcuts",
                                 "<table>"
                                 "<tr><td><b>Ctrl+S</b></td><td>Save tree</td></tr>"
                                 "<tr><td><b>Ctrl+O</b></td><td>Load tree</td></tr>"
                                 "<tr><td><b>Ctrl+E</b></td><td>Export image</td></tr>"
                                 "<tr><td><b>Ctrl+Z</b></td><td>Undo</td></tr>"
                                 "<tr><td><b>Ctrl+Y</b></td><td>Redo</td></tr>"
                                 "<tr><td><b>Ctrl+Del</b></td><td>Clear tree</td></tr>"
                                 "<tr><td><b>Ctrl+R</b></td><td>Random fill</td></tr>"
                                 "<tr><td><b>+/-</b></td><td>Zoom in/out</td></tr>"
                                 "<tr><td><b>Ctrl+0</b></td><td>Reset view</td></tr>"
                                 "<tr><td><b>Space</b></td><td>Next step (step mode)</td></tr>"
                                 "</table>");
    });

    // ======== Credit Label - Top Right Corner ========
    auto* creditLabel = new QLabel("✨ By: Mousa Alawad", menuBar);
    creditLabel->setStyleSheet(R"(
        QLabel {
            color: #A78BFA;
            font-size: 12px;
            font-weight: 700;
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 4px 14px;
            letter-spacing: 1px;
        }
    )");
    menuBar->setCornerWidget(creditLabel, Qt::TopRightCorner);
}

void MainWindow::setupStatusBar() {
    statusBar()->showMessage("Ready — B-Tree (t=3) | 0 nodes | Height: 0");
}

void MainWindow::setupConnections() {
    connect(controlPanel, &ControlPanel::insertRequested, this, &MainWindow::handleInsert);
    connect(controlPanel, &ControlPanel::deleteRequested, this, &MainWindow::handleDelete);
    connect(controlPanel, &ControlPanel::searchRequested, this, &MainWindow::handleSearch);
    connect(controlPanel, &ControlPanel::clearRequested, this, &MainWindow::handleClear);
    connect(controlPanel, &ControlPanel::randomRequested, this, &MainWindow::handleRandom);
    connect(controlPanel, &ControlPanel::stepModeToggled, this, &MainWindow::handleStepMode);
    connect(controlPanel, &ControlPanel::autoModeRequested, this, &MainWindow::handleAutoMode);
    connect(controlPanel, &ControlPanel::degreeChanged, this, &MainWindow::handleDegreeChanged);
    connect(controlPanel, &ControlPanel::speedChanged, this, &MainWindow::handleSpeedChanged);
    connect(controlPanel, &ControlPanel::undoRequested, this, &MainWindow::handleUndo);
    connect(controlPanel, &ControlPanel::redoRequested, this, &MainWindow::handleRedo);
    connect(controlPanel, &ControlPanel::saveRequested, this, &MainWindow::handleSave);
    connect(controlPanel, &ControlPanel::loadRequested, this, &MainWindow::handleLoad);
    connect(controlPanel, &ControlPanel::exportRequested, this, &MainWindow::handleExport);
    connect(controlPanel, &ControlPanel::themeToggled, this, &MainWindow::handleThemeToggle);
    connect(controlPanel, &ControlPanel::gridToggled, this, &MainWindow::handleGridToggle);
    connect(controlPanel, &ControlPanel::zoomInRequested, treeVisualizer, &TreeVisualizer::zoomIn);
    connect(controlPanel, &ControlPanel::zoomOutRequested, treeVisualizer, &TreeVisualizer::zoomOut);
    connect(controlPanel, &ControlPanel::resetViewRequested, treeVisualizer, &TreeVisualizer::resetView);
    connect(controlPanel, &ControlPanel::stepForwardRequested, this, &MainWindow::handleStepForward);

    connect(logger, &OperationLogger::entryAdded, infoPanel, &InfoPanel::addLogEntry);
    connect(stepTimer, &QTimer::timeout, this, &MainWindow::processNextAnimationStep);
}

void MainWindow::handleInsert(int key) {
    clearAnimationState();

    std::vector<OperationStep> steps;
    btree->insert(key, [&](const OperationStep& step) {
        steps.push_back(step);
    });

    logger->log("Insert", QString("Inserted key %1 into tree").arg(key),
                true, LogEntry::Level::Success);

    scheduleSteps(steps);
    updateStatusBar();
}

void MainWindow::handleDelete(int key) {
    clearAnimationState();

    std::vector<OperationStep> steps;
    bool success = btree->remove(key, [&](const OperationStep& step) {
        steps.push_back(step);
    });

    if (success) {
        logger->log("Delete", QString("Deleted key %1 from tree").arg(key),
                    true, LogEntry::Level::Success);
        showStatusMessage(QString("✓ Deleted key %1").arg(key));
    } else {
        logger->log("Delete", QString("Key %1 not found in tree").arg(key),
                    false, LogEntry::Level::Warning);
        showStatusMessage(QString("✗ Key %1 not found").arg(key), 2000);
    }

    scheduleSteps(steps);
    updateStatusBar();
}

void MainWindow::handleSearch(int key) {
    clearAnimationState();

    std::vector<OperationStep> steps;
    std::vector<std::shared_ptr<BTreeNode>> path;

    btree->search(key, [&](const OperationStep& step) {
        steps.push_back(step);
        if (step.node) path.push_back(step.node);
    });

    logger->log("Search", QString("Searched for key %1").arg(key),
                !steps.empty(), LogEntry::Level::Info);

    infoPanel->setCurrentPath(path);
    scheduleSteps(steps);
    updateStatusBar();
}

void MainWindow::handleClear() {
    auto result = QMessageBox::question(this, "Clear Tree",
                                        "Are you sure you want to clear the entire tree?",
                                        QMessageBox::Yes | QMessageBox::No);

    if (result == QMessageBox::Yes) {
        btree->clear();
        clearAnimationState();
        refreshVisualization();
        infoPanel->clearLog();
        logger->log("Clear", "Tree cleared", true, LogEntry::Level::Warning);
        showStatusMessage("Tree cleared");
        updateStatusBar();
    }
}

void MainWindow::handleRandom(int count) {
    clearAnimationState();
    btree->clear();

    std::set<int> used;
    std::vector<OperationStep> allSteps;

    for (int i = 0; i < count; i++) {
        int val;
        do {
            val = QRandomGenerator::global()->bounded(1, 200);
        } while (used.count(val));
        used.insert(val);

        btree->insert(val, [&](const OperationStep& step) {
            allSteps.push_back(step);
        });
    }

    logger->log("Random", QString("Generated %1 random values").arg(count),
                true, LogEntry::Level::Info);

    refreshVisualization();
    updateStatusBar();
    showStatusMessage(QString("✓ Generated %1 random values").arg(count));
}

void MainWindow::handleStepMode(bool enabled) {
    stepModeActive = enabled;
    if (!enabled) clearAnimationState();
    showStatusMessage(enabled ? "Step-by-step mode enabled" : "Step-by-step mode disabled");
}

void MainWindow::handleAutoMode() {
    btree->clear();
    refreshVisualization();

    auto* autoTimer = new QTimer(this);
    int* idx = new int(0);

    connect(autoTimer, &QTimer::timeout, this, [this, autoTimer, idx]() {
        static std::vector<int> vals = {
            50, 25, 75, 10, 30, 60, 90, 5, 15, 27,
            35, 55, 65, 85, 95, 3, 8, 40, 70, 80
        };
        if (*idx >= static_cast<int>(vals.size())) {
            autoTimer->stop();
            delete idx;
            autoTimer->deleteLater();
            showStatusMessage("Auto simulation complete!");
            return;
        }
        handleInsert(vals[(*idx)++]);
    });

    autoTimer->start(static_cast<int>(1200 / animSpeed));
    showStatusMessage("Running auto simulation...", 30000);
}

void MainWindow::handleDegreeChanged(int degree) {
    btree->setDegree(degree);
    refreshVisualization();
    updateStatusBar();
    showStatusMessage(QString("B-Tree degree changed to t=%1 (max keys: %2)")
                          .arg(degree).arg(2 * degree - 1));
}

void MainWindow::handleSpeedChanged(double speed) {
    animSpeed = speed;
    animController->setSpeed(speed);
}

void MainWindow::handleUndo() { undoStack->undo(); }
void MainWindow::handleRedo() { undoStack->redo(); }

void MainWindow::handleSave() {
    QString filename = QFileDialog::getSaveFileName(
        this, "Save B-Tree", QDir::homePath(),
        "B-Tree Files (*.btree);;JSON Files (*.json);;All Files (*)");
    if (filename.isEmpty()) return;

    QJsonDocument doc(btree->toJson());
    QFile file(filename);
    if (file.open(QIODevice::WriteOnly)) {
        file.write(doc.toJson(QJsonDocument::Indented));
        showStatusMessage(QString("✓ Tree saved to %1").arg(filename));
        logger->log("Save", "Tree saved to " + filename, true, LogEntry::Level::Success);
    } else {
        QMessageBox::critical(this, "Error", "Could not save file: " + file.errorString());
    }
}

void MainWindow::handleLoad() {
    QString filename = QFileDialog::getOpenFileName(
        this, "Load B-Tree", QDir::homePath(),
        "B-Tree Files (*.btree);;JSON Files (*.json);;All Files (*)");
    if (filename.isEmpty()) return;

    QFile file(filename);
    if (!file.open(QIODevice::ReadOnly)) {
        QMessageBox::critical(this, "Error", "Could not open file: " + file.errorString());
        return;
    }

    QJsonParseError parseError;
    QJsonDocument doc = QJsonDocument::fromJson(file.readAll(), &parseError);
    if (parseError.error != QJsonParseError::NoError) {
        QMessageBox::critical(this, "Error", "Invalid file format: " + parseError.errorString());
        return;
    }

    btree->fromJson(doc.object());
    refreshVisualization();
    updateStatusBar();
    showStatusMessage(QString("✓ Tree loaded from %1").arg(filename));
    logger->log("Load", "Tree loaded from " + filename, true, LogEntry::Level::Success);
}

void MainWindow::handleExport() {
    QString filename = QFileDialog::getSaveFileName(
        this, "Export Tree as Image", QDir::homePath(),
        "PNG Images (*.png);;JPEG Images (*.jpg);;SVG Files (*.svg);;All Files (*)");
    if (filename.isEmpty()) return;

    treeVisualizer->exportAsImage(filename);
    showStatusMessage(QString("✓ Image exported to %1").arg(filename));
    logger->log("Export", "Tree exported to " + filename, true, LogEntry::Level::Success);
}

void MainWindow::handleThemeToggle(bool dark) {
    StyleManager::instance().setTheme(dark ? StyleManager::Theme::Dark
                                           : StyleManager::Theme::Light);
    applyTheme(dark);
    treeVisualizer->setTheme(dark);
}

void MainWindow::handleGridToggle(bool show) {
    treeVisualizer->showGrid(show);
}

void MainWindow::handleStepForward() {
    if (!pendingSteps.empty() && currentStepIndex < static_cast<int>(pendingSteps.size())) {
        visualizeStep(pendingSteps[currentStepIndex]);
        currentStepIndex++;
        if (currentStepIndex >= static_cast<int>(pendingSteps.size())) {
            refreshVisualization();
            showStatusMessage("Operation complete");
        }
    }
}

void MainWindow::scheduleSteps(const std::vector<OperationStep>& steps) {
    pendingSteps = steps;
    currentStepIndex = 0;

    if (stepModeActive) {
        if (!steps.empty()) {
            visualizeStep(steps[0]);
            currentStepIndex = 1;
        }
        showStatusMessage(QString("Step 1/%1 — Press 'Next Step' to continue").arg(steps.size()));
    } else {
        if (!steps.empty()) processNextAnimationStep();
    }
}

void MainWindow::processNextAnimationStep() {
    if (currentStepIndex >= static_cast<int>(pendingSteps.size())) {
        refreshVisualization();
        updateStatusBar();
        return;
    }

    const OperationStep& step = pendingSteps[currentStepIndex];
    visualizeStep(step);
    currentStepIndex++;

    if (currentStepIndex < static_cast<int>(pendingSteps.size())) {
        stepTimer->start(getStepDelay());
    } else {
        QTimer::singleShot(getStepDelay(), this, [this]() {
            refreshVisualization();
            treeVisualizer->clearHighlights();
            updateStatusBar();
        });
    }
}

void MainWindow::visualizeStep(const OperationStep& step) {
    infoPanel->showStep(step);
    auto& sm = StyleManager::instance();

    if (step.node) {
        QColor color;
        switch (step.type) {
        case OperationStep::Type::Traverse:  color = sm.nodeSearchColor(); break;
        case OperationStep::Type::Found:     color = sm.successColor();    break;
        case OperationStep::Type::NotFound:  color = sm.errorColor();      break;
        case OperationStep::Type::Insert:    color = sm.successColor();    break;
        case OperationStep::Type::Split:     color = sm.nodeSplitColor();  break;
        case OperationStep::Type::Delete:    color = sm.errorColor();      break;
        case OperationStep::Type::Merge:     color = sm.warningColor();    break;
        case OperationStep::Type::Borrow:    color = sm.secondaryColor();  break;
        default:                             color = sm.primaryColor();
        }

        treeVisualizer->clearHighlights();
        treeVisualizer->highlightNode(step.node, color);

        if (step.type == OperationStep::Type::Split)
            treeVisualizer->animateNodeSplit(step.node);
    }

    showStatusMessage(step.explanation.left(100));
}

void MainWindow::clearAnimationState() {
    stepTimer->stop();
    pendingSteps.clear();
    currentStepIndex = 0;
    treeVisualizer->clearHighlights();
}

void MainWindow::refreshVisualization() {
    treeVisualizer->refresh();
    infoPanel->updateTreeStats(btree.get());
}

void MainWindow::updateStatusBar() {
    statusBar()->showMessage(
        QString("B-Tree (t=%1) | %2 nodes | %3 keys | Height: %4")
            .arg(btree->getDegree())
            .arg(btree->getNodeCount())
            .arg(btree->getKeyCount())
            .arg(btree->getHeight())
        );
}

void MainWindow::showStatusMessage(const QString& msg, int timeout) {
    statusBar()->showMessage(msg, timeout);
}

void MainWindow::applyTheme(bool dark) {
    qApp->setStyleSheet(StyleManager::instance().getMainStylesheet());
    treeVisualizer->scene()->update();
    update();
}

int MainWindow::getStepDelay() const {
    return static_cast<int>(800.0 / animSpeed);
}

void MainWindow::closeEvent(QCloseEvent* event) {
    if (btree->getKeyCount() > 0) {
        auto result = QMessageBox::question(this, "Exit",
                                            "Do you want to save the tree before exiting?",
                                            QMessageBox::Save | QMessageBox::Discard | QMessageBox::Cancel);

        if (result == QMessageBox::Save) {
            handleSave();
            event->accept();
        } else if (result == QMessageBox::Cancel) {
            event->ignore();
        } else {
            event->accept();
        }
    } else {
        event->accept();
    }
}

void MainWindow::keyPressEvent(QKeyEvent* event) {
    if (event->key() == Qt::Key_Space && stepModeActive) {
        handleStepForward();
        return;
    }
    if (event->key() == Qt::Key_Plus || event->key() == Qt::Key_Equal) {
        treeVisualizer->zoomIn();
        return;
    }
    if (event->key() == Qt::Key_Minus) {
        treeVisualizer->zoomOut();
        return;
    }
    QMainWindow::keyPressEvent(event);
}