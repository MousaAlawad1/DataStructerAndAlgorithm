#include <QApplication>
#include <QFontDatabase>
#include <QDir>
#include <QSplashScreen>
#include <QTimer>
#include <QPainter>
#include "ui/MainWindow.h"
#include "utils/StyleManager.h"

// Custom splash screen
class BTreeSplash : public QSplashScreen
{
public:
  explicit BTreeSplash() : QSplashScreen()
  {
    QPixmap pixmap(600, 380);
    pixmap.fill(Qt::transparent);

    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);

    // Background
    painter.setBrush(QColor("#0F1117"));
    painter.setPen(Qt::NoPen);
    painter.drawRoundedRect(pixmap.rect(), 20, 20);

    // Title
    QFont titleFont("Segoe UI", 32, QFont::Bold);
    painter.setFont(titleFont);
    painter.setPen(QColor("#6C63FF"));
    painter.drawText(pixmap.rect().adjusted(0, 60, 0, 0),
                     Qt::AlignHCenter | Qt::AlignTop,
                     "B-Tree Visualizer");

    // Subtitle
    QFont subFont("Segoe UI", 14);
    painter.setFont(subFont);
    painter.setPen(QColor("#8892A4"));
    painter.drawText(pixmap.rect().adjusted(0, 130, 0, 0),
                     Qt::AlignHCenter | Qt::AlignTop,
                     "Professional Educational Tool");

    // Version
    QFont verFont("Segoe UI", 11);
    painter.setFont(verFont);
    painter.setPen(QColor("#4ECDC4"));
    painter.drawText(pixmap.rect().adjusted(0, 170, 0, 0),
                     Qt::AlignHCenter | Qt::AlignTop,
                     "Version 1.0  |  Qt6 + C++17");

    // Loading bar background
    QRect barBg(60, 300, 480, 12);
    painter.setBrush(QColor("#1A1D27"));
    painter.drawRoundedRect(barBg, 6, 6);

    // Loading bar fill
    QLinearGradient grad(barBg.left(), 0, barBg.right(), 0);
    grad.setColorAt(0, QColor("#6C63FF"));
    grad.setColorAt(1, QColor("#4ECDC4"));
    QRect barFill(60, 300, 480, 12);
    painter.setBrush(grad);
    painter.drawRoundedRect(barFill, 6, 6);

    painter.setPen(QColor("#8892A4"));
    QFont loadFont("Segoe UI", 10);
    painter.setFont(loadFont);
    painter.drawText(pixmap.rect().adjusted(0, 322, 0, 0),
                     Qt::AlignHCenter | Qt::AlignTop,
                     "Loading components...");

    painter.end();
    setPixmap(pixmap);
  }
};

int main(int argc, char *argv[])
{
  QApplication app(argc, argv);

  // Application metadata
  app.setApplicationName("BTreeVisualizer");
  app.setApplicationVersion("1.0.0");
  app.setOrganizationName("CS Education Tools");
  app.setOrganizationDomain("btreevisualizer.edu");

  // High DPI support
  app.setAttribute(Qt::AA_UseHighDpiPixmaps);

  // Initial theme
  StyleManager::instance().setTheme(StyleManager::Theme::Dark);
  app.setStyleSheet(StyleManager::instance().getMainStylesheet());

  // Splash screen
  BTreeSplash splash;
  splash.show();
  app.processEvents();

  // Simulate loading
  QTimer::singleShot(1800, [&]()
                     { splash.close(); });

  // Create and show main window
  MainWindow window;

  QTimer::singleShot(1900, [&]()
                     { window.show(); });

  return app.exec();
}