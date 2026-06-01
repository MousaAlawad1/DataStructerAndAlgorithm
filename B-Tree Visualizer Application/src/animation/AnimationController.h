#pragma once
#include <QObject>
#include <QTimer>
#include <QPropertyAnimation>
#include <QSequentialAnimationGroup>
#include <functional>
#include <queue>
#include <memory>
#include "../btree/BTree.h"

struct AnimationFrame {
    std::shared_ptr<BTreeNode> targetNode;
    OperationStep step;
    int duration; // milliseconds
    std::function<void()> onStart;
    std::function<void()> onEnd;
};
// Alias for convenience
using AnimationStep = AnimationFrame;
class AnimationController : public QObject {
    Q_OBJECT

public:
    explicit AnimationController(QObject* parent = nullptr);

    void queueStep(const AnimationStep& frame);
    void queueFrame(const AnimationFrame& frame);
    void play();
    void pause();
    void stop();
    void setSpeed(double multiplier); // 0.5 = half speed, 2.0 = double
    bool isPlaying() const { return playing; }
    bool isPaused() const { return paused; }
    void stepForward();
    void stepBackward();
    void clearQueue();
    int remainingSteps() const;

signals:
    void frameStarted(const AnimationFrame& frame);
    void frameFinished(const AnimationFrame& frame);
    void allFinished();
    void stepChanged(int current, int total);

private slots:
    void processNextFrame();

private:
    std::queue<AnimationFrame> frameQueue;
    std::vector<AnimationFrame> frameHistory;
    QTimer* timer;
    bool playing;
    bool paused;
    double speedMultiplier;
    int currentFrameIndex;
    int totalFrames;

    void executeFrame(const AnimationFrame& frame);
};

