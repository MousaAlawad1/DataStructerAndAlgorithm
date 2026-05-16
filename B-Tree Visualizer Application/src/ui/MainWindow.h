#pragma once
#include <QMainWindow>
#include <QSplitter>
#include <QTimer>
#include <QStatusBar>
#include <QUndoStack>
#include <QUndoCommand>
#include <memory>
#include <vector>

#include "ControlPanel.h"
#include "TreeVisualizer.h"
#include "InfoPanel.h"
#include "../btree/BTree.h"
#include "../animation/AnimationController.h"
#include "../utils/OperationLogger.h"
#include "../utils/StyleManager.h"

// Undo/Redo Commands
class InsertCommand : public QUndoCommand {
public:
    InsertCommand(BTree* tree, int key, TreeVisualizer* viz, InfoPanel* info);
    void undo() override;
    void redo() override;
private:
    BTree* tree;
    int key;
    TreeVisualizer* visualizer;
    InfoPanel* infoPanel;
};

class DeleteCommand : public QUndoCommand {
public:
    DeleteCommand(BTree* tree, int key, TreeVisualizer* viz, InfoPanel* info);
    void undo() override;
    void redo() override;
private:
    BTree* tree;
    int key;
    bool wasSuccessful;
    TreeVisualizer* visualizer;
    InfoPanel* infoPanel;
};

class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow() = default;

protected:
    void closeEvent(QCloseEvent* event) override;
    void keyPressEvent(QKeyEvent* event) override;

private slots:
    void handleInsert(int key);
    void handleDelete(int key);
    void handleSearch(int key);
    void handleClear();
    void handleRandom(int count);
    void handleStepMode(bool enabled);
    void handleAutoMode();
    void handleDegreeChanged(int degree);
    void handleSpeedChanged(double speed);
    void handleUndo();
    void handleRedo();
    void handleSave();
    void handleLoad();
    void handleExport();
    void handleThemeToggle(bool dark);
    void handleGridToggle(bool show);
    void handleStepForward();
    void processNextAnimationStep();

private:
    // UI Components
    ControlPanel* controlPanel;
    TreeVisualizer* treeVisualizer;
    InfoPanel* infoPanel;
    QSplitter* mainSplitter;

    // Logic
    std::unique_ptr<BTree> btree;
    AnimationController* animController;
    OperationLogger* logger;
    QUndoStack* undoStack;

    // Animation state
    std::vector<OperationStep> pendingSteps;
    int currentStepIndex;
    QTimer* stepTimer;
    bool stepModeActive;
    double animSpeed;

    // Setup
    void setupUI();
    void setupMenuBar();
    void setupStatusBar();
    void setupConnections();
    void applyTheme(bool dark);

    // Helpers
    void refreshVisualization();
    void updateStatusBar();
    void showStatusMessage(const QString& msg, int timeout = 3000);
    void processOperationStep(const OperationStep& step);
    void scheduleSteps(const std::vector<OperationStep>& steps);
    void clearAnimationState();
    void visualizeStep(const OperationStep& step);
    int getStepDelay() const;
};