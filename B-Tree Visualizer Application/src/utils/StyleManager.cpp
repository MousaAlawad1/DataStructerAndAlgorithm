#include "StyleManager.h"
#include <QFontDatabase>

StyleManager& StyleManager::instance() {
    static StyleManager inst;
    return inst;
}

void StyleManager::setTheme(Theme t) {
    theme = t;
}

QColor StyleManager::backgroundColor() const {
    return theme == Theme::Dark ? QColor("#0F1117") : QColor("#F0F2F5");
}

QColor StyleManager::surfaceColor() const {
    return theme == Theme::Dark ? QColor("#1A1D27") : QColor("#FFFFFF");
}

QColor StyleManager::primaryColor() const {
    return QColor("#6C63FF");
}

QColor StyleManager::secondaryColor() const {
    return QColor("#4ECDC4");
}

QColor StyleManager::accentColor() const {
    return QColor("#FF6B6B");
}

QColor StyleManager::textColor() const {
    return theme == Theme::Dark ? QColor("#EAEAEA") : QColor("#1A1A2E");
}

QColor StyleManager::subtextColor() const {
    return theme == Theme::Dark ? QColor("#8892A4") : QColor("#6C757D");
}

QColor StyleManager::borderColor() const {
    return theme == Theme::Dark ? QColor("#2D3047") : QColor("#DEE2E6");
}

QColor StyleManager::nodeColor() const {
    return theme == Theme::Dark ? QColor("#252A3D") : QColor("#E8EEFF");
}

QColor StyleManager::nodeHighlightColor() const {
    return QColor("#6C63FF");
}

QColor StyleManager::nodeSearchColor() const {
    return QColor("#4ECDC4");
}

QColor StyleManager::nodeSplitColor() const {
    return QColor("#FF6B6B");
}

QColor StyleManager::edgeColor() const {
    return theme == Theme::Dark ? QColor("#3D4460") : QColor("#ADB5BD");
}

QColor StyleManager::gridColor() const {
    return theme == Theme::Dark ? QColor("#1E2235") : QColor("#E9ECEF");
}

QColor StyleManager::successColor() const {
    return QColor("#51CF66");
}

QColor StyleManager::errorColor() const {
    return QColor("#FF6B6B");
}

QColor StyleManager::warningColor() const {
    return QColor("#FCC419");
}

QString StyleManager::getMainStylesheet() const {
    QString bg = backgroundColor().name();
    QString surface = surfaceColor().name();
    QString text = textColor().name();
    QString subtext = subtextColor().name();
    QString border = borderColor().name();
    QString primary = primaryColor().name();

    return QString(R"(
        QMainWindow, QWidget {
            background-color: %1;
            color: %3;
            font-family: 'Segoe UI', 'SF Pro Display', Arial, sans-serif;
        }
        QScrollBar:vertical {
            background: %2;
            width: 8px;
            border-radius: 4px;
        }
        QScrollBar::handle:vertical {
            background: %6;
            border-radius: 4px;
            min-height: 20px;
        }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
            height: 0px;
        }
        QScrollBar:horizontal {
            background: %2;
            height: 8px;
            border-radius: 4px;
        }
        QScrollBar::handle:horizontal {
            background: %6;
            border-radius: 4px;
        }
        QToolTip {
            background-color: %2;
            color: %3;
            border: 1px solid %5;
            border-radius: 6px;
            padding: 6px;
            font-size: 12px;
        }
        QSplitter::handle {
            background-color: %5;
        }
        QSplitter::handle:horizontal {
            width: 2px;
        }
        QSplitter::handle:vertical {
            height: 2px;
        }
        QMenuBar {
            background-color: %2;
            color: %3;
            border-bottom: 1px solid %5;
            padding: 4px;
        }
        QMenuBar::item:selected {
            background-color: %6;
            border-radius: 4px;
        }
        QMenu {
            background-color: %2;
            color: %3;
            border: 1px solid %5;
            border-radius: 8px;
            padding: 4px;
        }
        QMenu::item:selected {
            background-color: %6;
            border-radius: 4px;
        }
        QStatusBar {
            background-color: %2;
            color: %4;
            border-top: 1px solid %5;
            font-size: 12px;
        }
    )").arg(bg, surface, text, subtext, border, primary);
}

QString StyleManager::getButtonStylesheet(const QString& baseColor) const {
    return QString(R"(
        QPushButton {
            background-color: %1;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        QPushButton:hover {
            background-color: %1;
            opacity: 0.85;
            border: 2px solid white;
        }
        QPushButton:pressed {
            background-color: %1;
            opacity: 0.7;
        }
        QPushButton:disabled {
            background-color: #3D4460;
            color: #6C757D;
        }
    )").arg(baseColor);
}

QString StyleManager::getPanelStylesheet() const {
    return QString(R"(
        QFrame {
            background-color: %1;
            border: 1px solid %2;
            border-radius: 12px;
        }
    )").arg(surfaceColor().name(), borderColor().name());
}

QString StyleManager::getInputStylesheet() const {
    return QString(R"(
        QLineEdit, QSpinBox, QComboBox {
            background-color: %1;
            color: %2;
            border: 2px solid %3;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
            border-color: %4;
        }
        QSpinBox::up-button, QSpinBox::down-button {
            background-color: %3;
            border-radius: 4px;
            width: 20px;
        }
        QComboBox::drop-down {
            border: none;
            width: 30px;
        }
        QComboBox::down-arrow {
            image: none;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid %2;
        }
        QComboBox QAbstractItemView {
            background-color: %1;
            color: %2;
            border: 1px solid %3;
            border-radius: 8px;
            selection-background-color: %4;
        }
    )").arg(surfaceColor().name(), textColor().name(),
            borderColor().name(), primaryColor().name());
}

QFont StyleManager::titleFont() const {
    QFont f("Segoe UI", 18, QFont::Bold);
    return f;
}

QFont StyleManager::bodyFont() const {
    QFont f("Segoe UI", 11);
    return f;
}

QFont StyleManager::monoFont() const {
    QFont f("Cascadia Code", 11);
    if (!QFontDatabase::families().contains("Cascadia Code")) {
        f.setFamily("Consolas");
    }
    return f;
}

QFont StyleManager::nodeFont() const {
    QFont f("Segoe UI", 13, QFont::Bold);
    return f;
}