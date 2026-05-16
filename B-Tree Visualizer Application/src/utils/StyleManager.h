#pragma once
#include <QString>
#include <QColor>
#include <QFont>

class StyleManager {
public:
    enum class Theme { Dark, Light };

    static StyleManager& instance();

    void setTheme(Theme theme);
    Theme currentTheme() const { return theme; }

    // Colors
    QColor backgroundColor() const;
    QColor surfaceColor() const;
    QColor primaryColor() const;
    QColor secondaryColor() const;
    QColor accentColor() const;
    QColor textColor() const;
    QColor subtextColor() const;
    QColor borderColor() const;
    QColor nodeColor() const;
    QColor nodeHighlightColor() const;
    QColor nodeSearchColor() const;
    QColor nodeSplitColor() const;
    QColor edgeColor() const;
    QColor gridColor() const;
    QColor successColor() const;
    QColor errorColor() const;
    QColor warningColor() const;

    // Stylesheet
    QString getMainStylesheet() const;
    QString getButtonStylesheet(const QString& baseColor) const;
    QString getPanelStylesheet() const;
    QString getInputStylesheet() const;

    // Fonts
    QFont titleFont() const;
    QFont bodyFont() const;
    QFont monoFont() const;
    QFont nodeFont() const;

private:
    StyleManager() : theme(Theme::Dark) {}
    Theme theme;
};