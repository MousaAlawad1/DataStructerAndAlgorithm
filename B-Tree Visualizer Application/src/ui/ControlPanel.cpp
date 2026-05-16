#include "ControlPanel.h"
#include "../utils/StyleManager.h"
#include <QEnterEvent>
#include <QPropertyAnimation>
#include <QIntValidator>
#include <QGroupBox>

// ==================== AnimatedButton ====================

AnimatedButton::AnimatedButton(const QString& text, const QString& color, QWidget* parent)
    : QPushButton(text, parent)
    , baseColor(color)
{
    QColor base(color);
    hoverColor = base.lighter(120);

    setCursor(Qt::PointingHandCursor);
    setMinimumHeight(34);

    setStyleSheet(QString(R"(
        QPushButton {
            background-color: %1;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'Segoe UI', Arial, sans-serif;
            text-align: center;
        }
        QPushButton:hover {
            background-color: %2;
        }
        QPushButton:pressed {
            background-color: %3;
        }
        QPushButton:disabled {
            background-color: #3D4460;
            color: #6C757D;
        }
    )").arg(color, hoverColor.name(), QColor(color).darker(120).name()));
}

void AnimatedButton::enterEvent(QEnterEvent* event) {
    QPushButton::enterEvent(event);
}

void AnimatedButton::leaveEvent(QEvent* event) {
    QPushButton::leaveEvent(event);
}

// ==================== ControlPanel ====================

ControlPanel::ControlPanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();
}

void ControlPanel::setupUI() {
    auto& sm = StyleManager::instance();

    setStyleSheet(QString(R"(
        QWidget {
            background-color: %1;
            color: %2;
        }
        QGroupBox {
            background-color: %3;
            border: 1px solid %4;
            border-radius: 10px;
            margin-top: 14px;
            padding-top: 4px;
            font-size: 10px;
            font-weight: 600;
            color: %5;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            top: 3px;
            color: %5;
            font-size: 10px;
        }
        QLabel {
            color: %2;
            font-size: 11px;
        }
        QCheckBox {
            color: %2;
            font-size: 11px;
            spacing: 6px;
        }
        QCheckBox::indicator {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid %4;
            background-color: %3;
        }
        QCheckBox::indicator:checked {
            background-color: %6;
            border-color: %6;
        }
        QSlider::groove:horizontal {
            height: 5px;
            background: %4;
            border-radius: 3px;
        }
        QSlider::handle:horizontal {
            width: 14px;
            height: 14px;
            background: %6;
            border-radius: 7px;
            margin: -5px 0;
        }
        QSlider::sub-page:horizontal {
            background: %6;
            border-radius: 3px;
        }
    )").arg(sm.backgroundColor().name(), sm.textColor().name(),
                           sm.surfaceColor().name(), sm.borderColor().name(),
                           sm.subtextColor().name(), sm.primaryColor().name()));

    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setSpacing(6);
    mainLayout->setContentsMargins(12, 6, 12, 6);

    // ======== ROW 1 ========
    auto* topRow = new QHBoxLayout();
    topRow->setSpacing(8);

    // --- Key Input ---
    auto* inputGroup = new QGroupBox("Key Input");
    auto* inputLayout = new QHBoxLayout(inputGroup);
    inputLayout->setSpacing(6);
    inputLayout->setContentsMargins(8, 10, 8, 8);

    keyInput = new QLineEdit(this);
    keyInput->setPlaceholderText("Enter value...");
    keyInput->setMinimumWidth(100);
    keyInput->setMaximumWidth(130);
    keyInput->setValidator(new QIntValidator(-9999, 9999, this));
    keyInput->setStyleSheet(sm.getInputStylesheet());
    keyInput->setAlignment(Qt::AlignCenter);
    QFont kf = sm.bodyFont();
    kf.setPointSize(13);
    keyInput->setFont(kf);
    keyInput->setFixedHeight(34);

    insertBtn = createActionButton("➕ Insert", sm.successColor().name(), "Insert key into tree");
    deleteBtn = createActionButton("➖ Delete", sm.errorColor().name(), "Delete key from tree");
    searchBtn = createActionButton("🔍 Search", sm.secondaryColor().name(), "Search for key");

    inputLayout->addWidget(keyInput);
    inputLayout->addWidget(insertBtn);
    inputLayout->addWidget(deleteBtn);
    inputLayout->addWidget(searchBtn);

    connect(insertBtn, &QPushButton::clicked, this, [this]() {
        bool ok;
        int val = keyInput->text().toInt(&ok);
        if (ok) { emit insertRequested(val); keyInput->clear(); }
    });
    connect(deleteBtn, &QPushButton::clicked, this, [this]() {
        bool ok;
        int val = keyInput->text().toInt(&ok);
        if (ok) { emit deleteRequested(val); keyInput->clear(); }
    });
    connect(searchBtn, &QPushButton::clicked, this, [this]() {
        bool ok;
        int val = keyInput->text().toInt(&ok);
        if (ok) emit searchRequested(val);
    });
    connect(keyInput, &QLineEdit::returnPressed, this, [this]() {
        insertBtn->click();
    });

    topRow->addWidget(inputGroup);

    // --- Tree Controls ---
    auto* treeGroup = new QGroupBox("Tree Controls");
    auto* treeLayout = new QHBoxLayout(treeGroup);
    treeLayout->setSpacing(6);
    treeLayout->setContentsMargins(8, 10, 8, 8);

    clearBtn  = createActionButton("🗑️ Clear",    "#FF6B6B", "Clear the entire tree");
    randomBtn = createActionButton("🎲 Random",   "#845EF7", "Generate random values");
    autoBtn   = createActionButton("▶ Auto Run",  "#339AF0", "Auto simulation mode");

    connect(clearBtn,  &QPushButton::clicked, this, &ControlPanel::clearRequested);
    connect(randomBtn, &QPushButton::clicked, this, [this]() { emit randomRequested(15); });
    connect(autoBtn,   &QPushButton::clicked, this, &ControlPanel::autoModeRequested);

    treeLayout->addWidget(clearBtn);
    treeLayout->addWidget(randomBtn);
    treeLayout->addWidget(autoBtn);

    topRow->addWidget(treeGroup);
    topRow->addStretch();

    // ======== ROW 2 ========
    auto* bottomRow = new QHBoxLayout();
    bottomRow->setSpacing(8);

    // --- Degree ---
    auto* degreeGroup = new QGroupBox("B-Tree Degree (t)");
    auto* degreeLayout = new QHBoxLayout(degreeGroup);
    degreeLayout->setSpacing(6);
    degreeLayout->setContentsMargins(8, 10, 8, 8);

    degreeSpinBox = new QSpinBox(this);
    degreeSpinBox->setMinimum(2);
    degreeSpinBox->setMaximum(10);
    degreeSpinBox->setValue(3);
    degreeSpinBox->setStyleSheet(sm.getInputStylesheet());
    degreeSpinBox->setFixedWidth(70);
    degreeSpinBox->setFixedHeight(34);

    auto* degreeInfoLabel = new QLabel("Min keys: 2\nMax keys: 5");
    degreeInfoLabel->setStyleSheet(QString("color: %1; font-size: 10px;")
                                       .arg(sm.subtextColor().name()));

    connect(degreeSpinBox, QOverload<int>::of(&QSpinBox::valueChanged), this,
            [this, degreeInfoLabel](int val) {
                degreeInfoLabel->setText(QString("Min: %1\nMax: %2")
                                             .arg(val - 1).arg(2 * val - 1));
                emit degreeChanged(val);
            });

    degreeLayout->addWidget(new QLabel("t ="));
    degreeLayout->addWidget(degreeSpinBox);
    degreeLayout->addWidget(degreeInfoLabel);

    // --- Degree (moved to bottom row) ---
    bottomRow->addWidget(degreeGroup);

    // --- Simulation ---
    auto* stepGroup = new QGroupBox("Simulation");
    auto* stepLayout = new QHBoxLayout(stepGroup);
    stepLayout->setSpacing(6);
    stepLayout->setContentsMargins(8, 10, 8, 8);

    stepModeCheck = new QCheckBox("Step-by-Step Mode", this);
    stepForwardBtn = createActionButton("⏭ Next Step", "#FCC419", "Advance one step");
    stepForwardBtn->setEnabled(false);
    stepForwardBtn->setFixedHeight(30);

    connect(stepModeCheck, &QCheckBox::toggled, this, [this](bool checked) {
        stepForwardBtn->setEnabled(checked);
        emit stepModeToggled(checked);
    });
    connect(stepForwardBtn, &QPushButton::clicked, this, &ControlPanel::stepForwardRequested);

    stepLayout->addWidget(stepModeCheck);
    stepLayout->addWidget(stepForwardBtn);

    bottomRow->addWidget(stepGroup);

    // --- Speed ---
    auto* speedGroup = new QGroupBox("Animation Speed");
    auto* speedLayout = new QHBoxLayout(speedGroup);
    speedLayout->setSpacing(6);
    speedLayout->setContentsMargins(8, 10, 8, 8);

    speedLabel = new QLabel("Speed: 1.0x", this);
    speedLabel->setAlignment(Qt::AlignCenter);
    speedLabel->setFixedWidth(75);

    speedSlider = new QSlider(Qt::Horizontal, this);
    speedSlider->setMinimum(1);
    speedSlider->setMaximum(50);
    speedSlider->setValue(10);
    speedSlider->setFixedWidth(110);

    connect(speedSlider, &QSlider::valueChanged, this, [this](int val) {
        double speed = val / 10.0;
        speedLabel->setText(QString("Speed: %1x").arg(speed, 0, 'f', 1));
        emit speedChanged(speed);
    });

    speedLayout->addWidget(speedLabel);
    speedLayout->addWidget(speedSlider);

    bottomRow->addWidget(speedGroup);

    // --- View ---
    auto* viewGroup = new QGroupBox("View");
    auto* viewLayout = new QHBoxLayout(viewGroup);
    viewLayout->setSpacing(6);
    viewLayout->setContentsMargins(8, 10, 8, 8);

    gridCheck = new QCheckBox("Grid", this);
    gridCheck->setChecked(true);
    connect(gridCheck, &QCheckBox::toggled, this, &ControlPanel::gridToggled);

    darkModeCheck = new QCheckBox("Dark", this);
    darkModeCheck->setChecked(true);
    connect(darkModeCheck, &QCheckBox::toggled, this, [this](bool checked) {
        emit themeToggled(checked);
    });

    QString zoomStyle = QString(R"(
        QPushButton {
            background-color: %1; color: %2;
            border: 1px solid %3; border-radius: 6px;
            padding: 3px 7px; font-size: 12px;
        }
        QPushButton:hover { background-color: %4; }
    )").arg(sm.surfaceColor().name(), sm.textColor().name(),
                                 sm.borderColor().name(), sm.backgroundColor().name());

    auto* zoomInBtn  = new QPushButton("🔍+", this);
    auto* zoomOutBtn = new QPushButton("🔍-", this);
    auto* resetBtn   = new QPushButton("⊡",   this);
    zoomInBtn->setStyleSheet(zoomStyle);
    zoomOutBtn->setStyleSheet(zoomStyle);
    resetBtn->setStyleSheet(zoomStyle);
    zoomInBtn->setCursor(Qt::PointingHandCursor);
    zoomOutBtn->setCursor(Qt::PointingHandCursor);
    resetBtn->setCursor(Qt::PointingHandCursor);
    zoomInBtn->setFixedHeight(28);
    zoomOutBtn->setFixedHeight(28);
    resetBtn->setFixedHeight(28);

    connect(zoomInBtn,  &QPushButton::clicked, this, &ControlPanel::zoomInRequested);
    connect(zoomOutBtn, &QPushButton::clicked, this, &ControlPanel::zoomOutRequested);
    connect(resetBtn,   &QPushButton::clicked, this, &ControlPanel::resetViewRequested);

    viewLayout->addWidget(gridCheck);
    viewLayout->addWidget(darkModeCheck);
    viewLayout->addWidget(zoomInBtn);
    viewLayout->addWidget(zoomOutBtn);
    viewLayout->addWidget(resetBtn);

    bottomRow->addWidget(viewGroup);
    bottomRow->addStretch();

    // --- File & History ---
    auto* fileGroup = new QGroupBox("File & History");
    auto* fileLayout = new QHBoxLayout(fileGroup);
    fileLayout->setSpacing(6);
    fileLayout->setContentsMargins(8, 10, 8, 8);

    auto makeSmallBtn = [&](const QString& text, const QString& tooltip) {
        auto* btn = new QPushButton(text, this);
        btn->setToolTip(tooltip);
        btn->setCursor(Qt::PointingHandCursor);
        btn->setFixedHeight(30);
        btn->setStyleSheet(QString(R"(
            QPushButton {
                background-color: %1; color: %2;
                border: 1px solid %3; border-radius: 6px;
                font-size: 11px; font-weight: 600;
                padding: 3px 8px;
            }
            QPushButton:hover { background-color: %4; border-color: %5; }
        )").arg(sm.surfaceColor().name(), sm.textColor().name(),
                                    sm.borderColor().name(), sm.backgroundColor().name(),
                                    sm.primaryColor().name()));
        return btn;
    };

    auto* undoBtn   = makeSmallBtn("↩️ Undo",   "Undo last operation");
    auto* redoBtn   = makeSmallBtn("↪️ Redo",   "Redo last undone operation");
    auto* saveBtn   = makeSmallBtn("💾 Save",   "Save tree to file");
    auto* loadBtn   = makeSmallBtn("📂 Load",   "Load tree from file");
    auto* exportBtn = makeSmallBtn("📷 Export", "Export as image");

    connect(undoBtn,   &QPushButton::clicked, this, &ControlPanel::undoRequested);
    connect(redoBtn,   &QPushButton::clicked, this, &ControlPanel::redoRequested);
    connect(saveBtn,   &QPushButton::clicked, this, &ControlPanel::saveRequested);
    connect(loadBtn,   &QPushButton::clicked, this, &ControlPanel::loadRequested);
    connect(exportBtn, &QPushButton::clicked, this, &ControlPanel::exportRequested);

    fileLayout->addWidget(undoBtn);
    fileLayout->addWidget(redoBtn);
    fileLayout->addWidget(saveBtn);
    fileLayout->addWidget(loadBtn);
    fileLayout->addWidget(exportBtn);

    bottomRow->addWidget(fileGroup);

    // ======== Assemble ========
    mainLayout->addLayout(topRow);
    mainLayout->addLayout(bottomRow);
}

AnimatedButton* ControlPanel::createActionButton(const QString& text,
                                                 const QString& color,
                                                 const QString& tooltip) {
    auto* btn = new AnimatedButton(text, color, this);
    btn->setToolTip(tooltip);
    btn->setMinimumWidth(90);
    return btn;
}

int ControlPanel::getInputValue() const {
    return keyInput->text().toInt();
}

void ControlPanel::setDegree(int d) {
    degreeSpinBox->setValue(d);
}

int ControlPanel::getDegree() const {
    return degreeSpinBox->value();
}

double ControlPanel::getAnimationSpeed() const {
    return speedSlider->value() / 10.0;
}

bool ControlPanel::isStepModeEnabled() const {
    return stepModeCheck->isChecked();
}

bool ControlPanel::isGridEnabled() const {
    return gridCheck->isChecked();
}