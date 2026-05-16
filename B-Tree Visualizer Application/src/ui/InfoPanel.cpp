#include "InfoPanel.h"
#include "../utils/StyleManager.h"
#include <QScrollArea>
#include <QGraphicsDropShadowEffect>

InfoPanel::InfoPanel(QWidget* parent)
    : QWidget(parent)
    , pulseState(false)
{
    setupUI();

    pulseTimer = new QTimer(this);
    connect(pulseTimer, &QTimer::timeout, this, [this]() {
        pulseState = !pulseState;
    });
}

void InfoPanel::setupUI() {
    auto& sm = StyleManager::instance();
    setMinimumWidth(280);
    setMaximumWidth(360);

    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setSpacing(12);
    mainLayout->setContentsMargins(12, 12, 12, 12);

    // ---- Header ----
    auto* headerLabel = new QLabel("📊 Tree Analytics", this);
    headerLabel->setFont(sm.titleFont());
    QFont hf = sm.titleFont();
    hf.setPointSize(14);
    headerLabel->setFont(hf);
    headerLabel->setStyleSheet(QString("color: %1; font-weight: bold; margin-bottom: 8px;")
                               .arg(sm.primaryColor().name()));
    mainLayout->addWidget(headerLabel);

    // ---- Stats Grid ----
    auto* statsFrame = new QFrame(this);
    statsFrame->setStyleSheet(QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
            padding: 4px;
        }
    )").arg(sm.surfaceColor().name(), sm.borderColor().name()));

    auto* statsLayout = new QGridLayout(statsFrame);
    statsLayout->setSpacing(8);
    statsLayout->setContentsMargins(12, 12, 12, 12);

    auto addStat = [&](const QString& icon, const QString& label,
                        QLabel*& valueRef, int row, int col) {
        auto* container = new QWidget();
        auto* vl = new QVBoxLayout(container);
        vl->setSpacing(2);
        vl->setContentsMargins(8, 6, 8, 6);

        auto* iconLabel = new QLabel(icon + " " + label);
        iconLabel->setStyleSheet(QString("color: %1; font-size: 10px; font-weight: 600;")
                                 .arg(sm.subtextColor().name()));

        valueRef = new QLabel("—");
        valueRef->setStyleSheet(QString("color: %1; font-size: 18px; font-weight: bold;")
                                .arg(sm.textColor().name()));

        vl->addWidget(iconLabel);
        vl->addWidget(valueRef);
        container->setStyleSheet(QString(R"(
            QWidget {
                background-color: %1;
                border-radius: 8px;
            }
        )").arg(sm.backgroundColor().name()));

        statsLayout->addWidget(container, row, col);
    };

    addStat("🌳", "Height", heightLabel, 0, 0);
    addStat("📦", "Nodes", nodeCountLabel, 0, 1);
    addStat("🔑", "Keys", keyCountLabel, 1, 0);
    addStat("⚙️", "Degree", degreeLabel, 1, 1);

    mainLayout->addWidget(statsFrame);

    // ---- Current Operation ----
    auto* opFrame = new QFrame(this);
    opFrame->setStyleSheet(QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
        }
    )").arg(sm.surfaceColor().name(), sm.borderColor().name()));

    auto* opLayout = new QVBoxLayout(opFrame);
    opLayout->setContentsMargins(12, 10, 12, 10);
    opLayout->setSpacing(6);

    auto* opTitle = new QLabel("⚡ Current Operation");
    opTitle->setStyleSheet(QString("color: %1; font-size: 11px; font-weight: 600;")
                           .arg(sm.subtextColor().name()));

    operationLabel = new QLabel("—");
    operationLabel->setStyleSheet(QString("color: %1; font-size: 14px; font-weight: bold;")
                                  .arg(sm.primaryColor().name()));
    operationLabel->setWordWrap(true);

    complexityLabel = new QLabel("Time: O(log n)  |  Space: O(t·logₜn)");
    complexityLabel->setStyleSheet(QString("color: %1; font-size: 10px; font-style: italic;")
                                   .arg(sm.subtextColor().name()));

    statusLabel = new QLabel("Ready");
    statusLabel->setStyleSheet(QString(R"(
        QLabel {
            background-color: %1;
            color: white;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: bold;
        }
    )").arg(sm.secondaryColor().name()));
    statusLabel->setAlignment(Qt::AlignCenter);
    statusLabel->setFixedHeight(24);

    opLayout->addWidget(opTitle);
    opLayout->addWidget(operationLabel);
    opLayout->addWidget(complexityLabel);
    opLayout->addWidget(statusLabel);

    mainLayout->addWidget(opFrame);

    // ---- Traversal Path ----
    auto* pathFrame = new QFrame(this);
    pathFrame->setStyleSheet(QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
        }
    )").arg(sm.surfaceColor().name(), sm.borderColor().name()));

    auto* pathLayout = new QVBoxLayout(pathFrame);
    pathLayout->setContentsMargins(12, 10, 12, 10);
    pathLayout->setSpacing(4);

    auto* pathTitle = new QLabel("🗺️ Traversal Path");
    pathTitle->setStyleSheet(QString("color: %1; font-size: 11px; font-weight: 600;")
                             .arg(sm.subtextColor().name()));

    pathLabel = new QLabel("—");
    pathLabel->setWordWrap(true);
    pathLabel->setStyleSheet(QString("color: %1; font-size: 12px; font-family: 'Cascadia Code', Consolas, monospace;")
                             .arg(sm.textColor().name()));

    pathLayout->addWidget(pathTitle);
    pathLayout->addWidget(pathLabel);
    mainLayout->addWidget(pathFrame);

    // ---- Explanation Panel ----
    auto* explFrame = new QFrame(this);
    explFrame->setStyleSheet(QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
        }
    )").arg(sm.surfaceColor().name(), sm.borderColor().name()));

    auto* explLayout = new QVBoxLayout(explFrame);
    explLayout->setContentsMargins(12, 10, 12, 10);
    explLayout->setSpacing(6);

    auto* explTitle = new QLabel("💡 Explanation");
    explTitle->setStyleSheet(QString("color: %1; font-size: 11px; font-weight: 600;")
                             .arg(sm.subtextColor().name()));

    explanationText = new QTextEdit(this);
    explanationText->setReadOnly(true);
    explanationText->setMaximumHeight(150);
    explanationText->setStyleSheet(QString(R"(
        QTextEdit {
            background-color: %1;
            color: %2;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            line-height: 1.5;
            padding: 4px;
        }
    )").arg(sm.backgroundColor().name(), sm.textColor().name()));

    explLayout->addWidget(explTitle);
    explLayout->addWidget(explanationText);
    mainLayout->addWidget(explFrame);

    // ---- Operation Log ----
    auto* logFrame = new QFrame(this);
    logFrame->setStyleSheet(QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
        }
    )").arg(sm.surfaceColor().name(), sm.borderColor().name()));

    auto* logLayout = new QVBoxLayout(logFrame);
    logLayout->setContentsMargins(12, 10, 12, 10);
    logLayout->setSpacing(6);

    auto* logTitle = new QLabel("📋 Operation Log");
    logTitle->setStyleSheet(QString("color: %1; font-size: 11px; font-weight: 600;")
                            .arg(sm.subtextColor().name()));

    logText = new QTextEdit(this);
    logText->setReadOnly(true);
    logText->setMaximumHeight(120);
    logText->setStyleSheet(QString(R"(
        QTextEdit {
            background-color: %1;
            color: %2;
            border: none;
            border-radius: 6px;
            font-family: 'Cascadia Code', Consolas, monospace;
            font-size: 11px;
            padding: 4px;
        }
    )").arg(sm.backgroundColor().name(), sm.subtextColor().name()));

    logLayout->addWidget(logTitle);
    logLayout->addWidget(logText);
    mainLayout->addWidget(logFrame);

    mainLayout->addStretch();
}

void InfoPanel::updateTreeStats(BTree* tree) {
    if (!tree) {
        heightLabel->setText("—");
        nodeCountLabel->setText("—");
        keyCountLabel->setText("—");
        degreeLabel->setText("—");
        return;
    }

    heightLabel->setText(QString::number(tree->getHeight()));
    nodeCountLabel->setText(QString::number(tree->getNodeCount()));
    keyCountLabel->setText(QString::number(tree->getKeyCount()));
    degreeLabel->setText(QString("t=%1").arg(tree->getDegree()));
}

void InfoPanel::showExplanation(const QString& text, const QString& operation) {
    if (!operation.isEmpty()) {
        operationLabel->setText(operation);
    }

    QString html = QString(R"(
        <div style="line-height: 1.6; color: %1;">
            <p>%2</p>
        </div>
    )").arg(StyleManager::instance().textColor().name())
     .arg(text.toHtmlEscaped().replace("\n", "<br>"));

    explanationText->setHtml(html);
}

void InfoPanel::showStep(const OperationStep& step) {
    auto& sm = StyleManager::instance();

    QString opName;
    QString statusColor;

    switch (step.type) {
        case OperationStep::Type::Insert:
            opName = "🟢 Insert";
            statusColor = sm.successColor().name();
            break;
        case OperationStep::Type::Delete:
            opName = "🔴 Delete";
            statusColor = sm.errorColor().name();
            break;
        case OperationStep::Type::Found:
            opName = "✅ Found";
            statusColor = sm.successColor().name();
            break;
        case OperationStep::Type::NotFound:
            opName = "❌ Not Found";
            statusColor = sm.errorColor().name();
            break;
        case OperationStep::Type::Split:
            opName = "✂️ Split";
            statusColor = sm.nodeSplitColor().name();
            break;
        case OperationStep::Type::Merge:
            opName = "🔗 Merge";
            statusColor = sm.warningColor().name();
            break;
        case OperationStep::Type::Borrow:
            opName = "↔️ Borrow";
            statusColor = sm.secondaryColor().name();
            break;
        case OperationStep::Type::Traverse:
            opName = "🔍 Traversing";
            statusColor = sm.primaryColor().name();
            break;
        default:
            opName = "⚙️ Operation";
            statusColor = sm.primaryColor().name();
    }

    operationLabel->setText(opName + " key: " + QString::number(step.key));
    statusLabel->setText(opName);
    statusLabel->setStyleSheet(QString(R"(
        QLabel {
            background-color: %1;
            color: white;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: bold;
        }
    )").arg(statusColor));

    if (!step.explanation.isEmpty()) {
        showExplanation(step.explanation, opName);
    }

    // Log
    QString timestamp = QTime::currentTime().toString("HH:mm:ss");
    logText->append(QString("<span style='color: %1;'>[%2]</span> %3")
                    .arg(sm.subtextColor().name())
                    .arg(timestamp)
                    .arg(step.explanation.left(80)));
}

void InfoPanel::addLogEntry(const LogEntry& entry) {
    auto& sm = StyleManager::instance();
    QString color;

    switch (entry.level) {
        case LogEntry::Level::Success: color = sm.successColor().name(); break;
        case LogEntry::Level::Warning: color = sm.warningColor().name(); break;
        case LogEntry::Level::Error:   color = sm.errorColor().name(); break;
        default:                       color = sm.subtextColor().name();
    }

    logText->append(QString("<span style='color: %1;'>[%2] %3: %4</span>")
                    .arg(color)
                    .arg(entry.timestamp.toString("HH:mm:ss"))
                    .arg(entry.operation)
                    .arg(entry.description));
}

void InfoPanel::clearLog() {
    logText->clear();
    explanationText->clear();
    operationLabel->setText("—");
    pathLabel->setText("—");
    statusLabel->setText("Ready");
}

void InfoPanel::setCurrentPath(const std::vector<std::shared_ptr<BTreeNode>>& path) {
    if (path.empty()) {
        pathLabel->setText("—");
        return;
    }

    QStringList parts;
    for (auto& node : path) {
        parts << node->toString();
    }
    pathLabel->setText(parts.join(" → "));
}