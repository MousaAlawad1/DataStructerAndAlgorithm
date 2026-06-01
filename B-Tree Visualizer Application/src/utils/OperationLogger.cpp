#include "OperationLogger.h"
#include <QFile>
#include <QTextStream>

OperationLogger::OperationLogger(QObject* parent)
    : QObject(parent)
    , maxEntries(1000)
{
}

void OperationLogger::log(const QString& operation, const QString& description,
                           bool success, LogEntry::Level level) {
    if (static_cast<int>(entries.size()) >= maxEntries) {
        entries.erase(entries.begin());
    }

    LogEntry entry;
    entry.timestamp = QDateTime::currentDateTime();
    entry.operation = operation;
    entry.description = description;
    entry.success = success;
    entry.level = level;

    entries.push_back(entry);
    emit entryAdded(entry);
}

void OperationLogger::logStep(const QString& stepDescription) {
    log("Step", stepDescription, true, LogEntry::Level::Info);
}

void OperationLogger::clear() {
    entries.clear();
}

QString OperationLogger::getFormattedLog() const {
    QString result;
    for (const auto& entry : entries) {
        result += QString("[%1] %2: %3\n")
            .arg(entry.timestamp.toString("HH:mm:ss.zzz"))
            .arg(entry.operation)
            .arg(entry.description);
    }
    return result;
}

void OperationLogger::exportToFile(const QString& filename) const {
    QFile file(filename);
    if (file.open(QIODevice::WriteOnly | QIODevice::Text)) {
        QTextStream stream(&file);
        stream << getFormattedLog();
    }
}