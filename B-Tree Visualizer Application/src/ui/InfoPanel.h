#pragma once
#include <QWidget>
#include <QLabel>
#include <QTextEdit>
#include <QVBoxLayout>
#include <QFrame>
#include <QTimer>
#include "../btree/BTree.h"
#include "../utils/OperationLogger.h"

class InfoPanel : public QWidget {
    Q_OBJECT

public:
    explicit InfoPanel(QWidget* parent = nullptr);

    void updateTreeStats(BTree* tree);
    void showExplanation(const QString& text, const QString& operation = "");
    void showStep(const OperationStep& step);
    void addLogEntry(const LogEntry& entry);
    void clearLog();
    void setCurrentPath(const std::vector<std::shared_ptr<BTreeNode>>& path);

private:
    // Stats widgets
    QLabel* heightLabel;
    QLabel* nodeCountLabel;
    QLabel* keyCountLabel;
    QLabel* degreeLabel;
    QLabel* complexityLabel;
    QLabel* operationLabel;
    QLabel* statusLabel;

    // Explanation area
    QTextEdit* explanationText;
    QTextEdit* logText;
    QLabel* pathLabel;

    // Animation for status
    QTimer* pulseTimer;
    bool pulseState;

    void setupUI();
    QFrame* createStatCard(const QString& title, QLabel*& valueLabel,
                           const QString& icon = "");
    QFrame* createSection(const QString& title, QWidget* content);
    void applyStatusColor(const QString& type);
};