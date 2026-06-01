#pragma once
#include <QObject>
#include <QString>
#include <QDateTime>
#include <vector>

struct LogEntry {
    QDateTime timestamp;
    QString operation;
    QString description;
    QString result;
    bool success;
    enum class Level { Info, Warning, Error, Success } level;
};

class OperationLogger : public QObject {
    Q_OBJECT

public:
    explicit OperationLogger(QObject* parent = nullptr);

    void log(const QString& operation, const QString& description,
             bool success = true, LogEntry::Level level = LogEntry::Level::Info);
    void logStep(const QString& stepDescription);
    void clear();

    const std::vector<LogEntry>& getEntries() const { return entries; }
    QString getFormattedLog() const;
    void exportToFile(const QString& filename) const;

signals:
    void entryAdded(const LogEntry& entry);

private:
    std::vector<LogEntry> entries;
    int maxEntries;
};