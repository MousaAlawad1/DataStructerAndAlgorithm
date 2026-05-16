#pragma once
#include <QWidget>
#include <QPushButton>
#include <QLineEdit>
#include <QSpinBox>
#include <QSlider>
#include <QLabel>
#include <QCheckBox>
#include <QComboBox>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QTimer>

class AnimatedButton : public QPushButton {
    Q_OBJECT

public:
    explicit AnimatedButton(const QString& text, const QString& color,
                            QWidget* parent = nullptr);

protected:
    void enterEvent(QEnterEvent* event) override;
    void leaveEvent(QEvent* event) override;

private:
    QString baseColor;
    QColor hoverColor;
};

class ControlPanel : public QWidget {
    Q_OBJECT

public:
    explicit ControlPanel(QWidget* parent = nullptr);

    int getInputValue() const;
    void setDegree(int d);
    int getDegree() const;
    double getAnimationSpeed() const;
    bool isStepModeEnabled() const;
    bool isGridEnabled() const;

signals:
    void insertRequested(int key);
    void deleteRequested(int key);
    void searchRequested(int key);
    void clearRequested();
    void randomRequested(int count);
    void stepModeToggled(bool enabled);
    void autoModeRequested();
    void degreeChanged(int degree);
    void speedChanged(double speed);
    void undoRequested();
    void redoRequested();
    void saveRequested();
    void loadRequested();
    void exportRequested();
    void themeToggled(bool dark);
    void gridToggled(bool show);
    void zoomInRequested();
    void zoomOutRequested();
    void resetViewRequested();
    void stepForwardRequested();

private:
    QLineEdit* keyInput;
    QSpinBox* degreeSpinBox;
    QSlider* speedSlider;
    QLabel* speedLabel;
    QCheckBox* stepModeCheck;
    QCheckBox* gridCheck;
    QCheckBox* darkModeCheck;
    QComboBox* presetCombo;

    // Buttons
    AnimatedButton* insertBtn;
    AnimatedButton* deleteBtn;
    AnimatedButton* searchBtn;
    AnimatedButton* clearBtn;
    AnimatedButton* randomBtn;
    AnimatedButton* autoBtn;
    AnimatedButton* stepForwardBtn;

    void setupUI();
    AnimatedButton* createActionButton(const QString& text, const QString& color,
                                       const QString& tooltip);
    QWidget* createSeparator();
    void applyInputValidation();
};