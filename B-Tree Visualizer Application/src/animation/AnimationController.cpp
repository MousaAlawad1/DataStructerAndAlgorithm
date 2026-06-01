#include "AnimationController.h"
#include <QDebug>

AnimationController::AnimationController(QObject* parent)
    : QObject(parent)
    , playing(false)
    , paused(false)
    , speedMultiplier(1.0)
    , currentFrameIndex(0)
    , totalFrames(0)
{
    timer = new QTimer(this);
    timer->setSingleShot(true);
    connect(timer, &QTimer::timeout, this, &AnimationController::processNextFrame);
}

void AnimationController::queueFrame(const AnimationFrame& frame) {
    frameQueue.push(frame);
    frameHistory.push_back(frame);
    totalFrames++;
    emit stepChanged(currentFrameIndex, totalFrames);
}

void AnimationController::play() {
    if (!playing && !frameQueue.empty()) {
        playing = true;
        paused = false;
        processNextFrame();
    } else if (paused) {
        paused = false;
        processNextFrame();
    }
}

void AnimationController::pause() {
    paused = true;
    timer->stop();
}

void AnimationController::stop() {
    playing = false;
    paused = false;
    timer->stop();
    while (!frameQueue.empty()) frameQueue.pop();
    currentFrameIndex = 0;
    totalFrames = 0;
    emit allFinished();
}

void AnimationController::clearQueue() {
    while (!frameQueue.empty()) frameQueue.pop();
    frameHistory.clear();
    totalFrames = 0;
    currentFrameIndex = 0;
}

void AnimationController::setSpeed(double multiplier) {
    speedMultiplier = std::max(0.1, std::min(5.0, multiplier));
}

void AnimationController::stepForward() {
    if (!frameQueue.empty() && !playing) {
        processNextFrame();
    }
}

void AnimationController::processNextFrame() {
    if (paused || frameQueue.empty()) {
        if (frameQueue.empty()) {
            playing = false;
            emit allFinished();
        }
        return;
    }

    AnimationFrame frame = frameQueue.front();
    frameQueue.pop();
    currentFrameIndex++;

    emit stepChanged(currentFrameIndex, totalFrames);
    emit frameStarted(frame);

    executeFrame(frame);

    int adjustedDuration = static_cast<int>(frame.duration / speedMultiplier);
    timer->start(adjustedDuration);
}

void AnimationController::executeFrame(const AnimationFrame& frame) {
    if (frame.onStart) frame.onStart();

    if (frame.targetNode) {
        frame.targetNode->highlighted = true;
        frame.targetNode->highlightedKeyIndex = frame.step.keyIndex;
    }

    emit frameFinished(frame);
    if (frame.onEnd) frame.onEnd();
}

int AnimationController::remainingSteps() const {
    return static_cast<int>(frameQueue.size());
}