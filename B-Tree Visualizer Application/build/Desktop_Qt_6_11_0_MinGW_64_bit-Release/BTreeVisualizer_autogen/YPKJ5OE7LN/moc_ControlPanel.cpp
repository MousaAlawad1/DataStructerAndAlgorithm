/****************************************************************************
** Meta object code from reading C++ file 'ControlPanel.h'
**
** Created by: The Qt Meta Object Compiler version 69 (Qt 6.11.0)
**
** WARNING! All changes made in this file will be lost!
*****************************************************************************/

#include "../../../../src/ui/ControlPanel.h"
#include <QtGui/qtextcursor.h>
#include <QtCore/qmetatype.h>

#include <QtCore/qtmochelpers.h>

#include <memory>


#include <QtCore/qxptype_traits.h>
#if !defined(Q_MOC_OUTPUT_REVISION)
#error "The header file 'ControlPanel.h' doesn't include <QObject>."
#elif Q_MOC_OUTPUT_REVISION != 69
#error "This file was generated using the moc from 6.11.0. It"
#error "cannot be used with the include files from this version of Qt."
#error "(The moc has changed too much.)"
#endif

#ifndef Q_CONSTINIT
#define Q_CONSTINIT
#endif

QT_WARNING_PUSH
QT_WARNING_DISABLE_DEPRECATED
QT_WARNING_DISABLE_GCC("-Wuseless-cast")
namespace {
struct qt_meta_tag_ZN14AnimatedButtonE_t {};
} // unnamed namespace

template <> constexpr inline auto AnimatedButton::qt_create_metaobjectdata<qt_meta_tag_ZN14AnimatedButtonE_t>()
{
    namespace QMC = QtMocConstants;
    QtMocHelpers::StringRefStorage qt_stringData {
        "AnimatedButton"
    };

    QtMocHelpers::UintData qt_methods {
    };
    QtMocHelpers::UintData qt_properties {
    };
    QtMocHelpers::UintData qt_enums {
    };
    return QtMocHelpers::metaObjectData<AnimatedButton, qt_meta_tag_ZN14AnimatedButtonE_t>(QMC::MetaObjectFlag{}, qt_stringData,
            qt_methods, qt_properties, qt_enums);
}
Q_CONSTINIT const QMetaObject AnimatedButton::staticMetaObject = { {
    QMetaObject::SuperData::link<QPushButton::staticMetaObject>(),
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN14AnimatedButtonE_t>.stringdata,
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN14AnimatedButtonE_t>.data,
    qt_static_metacall,
    nullptr,
    qt_staticMetaObjectRelocatingContent<qt_meta_tag_ZN14AnimatedButtonE_t>.metaTypes,
    nullptr
} };

void AnimatedButton::qt_static_metacall(QObject *_o, QMetaObject::Call _c, int _id, void **_a)
{
    auto *_t = static_cast<AnimatedButton *>(_o);
    (void)_t;
    (void)_c;
    (void)_id;
    (void)_a;
}

const QMetaObject *AnimatedButton::metaObject() const
{
    return QObject::d_ptr->metaObject ? QObject::d_ptr->dynamicMetaObject() : &staticMetaObject;
}

void *AnimatedButton::qt_metacast(const char *_clname)
{
    if (!_clname) return nullptr;
    if (!strcmp(_clname, qt_staticMetaObjectStaticContent<qt_meta_tag_ZN14AnimatedButtonE_t>.strings))
        return static_cast<void*>(this);
    return QPushButton::qt_metacast(_clname);
}

int AnimatedButton::qt_metacall(QMetaObject::Call _c, int _id, void **_a)
{
    _id = QPushButton::qt_metacall(_c, _id, _a);
    return _id;
}
namespace {
struct qt_meta_tag_ZN12ControlPanelE_t {};
} // unnamed namespace

template <> constexpr inline auto ControlPanel::qt_create_metaobjectdata<qt_meta_tag_ZN12ControlPanelE_t>()
{
    namespace QMC = QtMocConstants;
    QtMocHelpers::StringRefStorage qt_stringData {
        "ControlPanel",
        "insertRequested",
        "",
        "key",
        "deleteRequested",
        "searchRequested",
        "clearRequested",
        "randomRequested",
        "count",
        "stepModeToggled",
        "enabled",
        "autoModeRequested",
        "degreeChanged",
        "degree",
        "speedChanged",
        "speed",
        "undoRequested",
        "redoRequested",
        "saveRequested",
        "loadRequested",
        "exportRequested",
        "themeToggled",
        "dark",
        "gridToggled",
        "show",
        "zoomInRequested",
        "zoomOutRequested",
        "resetViewRequested",
        "stepForwardRequested"
    };

    QtMocHelpers::UintData qt_methods {
        // Signal 'insertRequested'
        QtMocHelpers::SignalData<void(int)>(1, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 3 },
        }}),
        // Signal 'deleteRequested'
        QtMocHelpers::SignalData<void(int)>(4, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 3 },
        }}),
        // Signal 'searchRequested'
        QtMocHelpers::SignalData<void(int)>(5, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 3 },
        }}),
        // Signal 'clearRequested'
        QtMocHelpers::SignalData<void()>(6, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'randomRequested'
        QtMocHelpers::SignalData<void(int)>(7, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 8 },
        }}),
        // Signal 'stepModeToggled'
        QtMocHelpers::SignalData<void(bool)>(9, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Bool, 10 },
        }}),
        // Signal 'autoModeRequested'
        QtMocHelpers::SignalData<void()>(11, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'degreeChanged'
        QtMocHelpers::SignalData<void(int)>(12, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 13 },
        }}),
        // Signal 'speedChanged'
        QtMocHelpers::SignalData<void(double)>(14, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Double, 15 },
        }}),
        // Signal 'undoRequested'
        QtMocHelpers::SignalData<void()>(16, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'redoRequested'
        QtMocHelpers::SignalData<void()>(17, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'saveRequested'
        QtMocHelpers::SignalData<void()>(18, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'loadRequested'
        QtMocHelpers::SignalData<void()>(19, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'exportRequested'
        QtMocHelpers::SignalData<void()>(20, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'themeToggled'
        QtMocHelpers::SignalData<void(bool)>(21, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Bool, 22 },
        }}),
        // Signal 'gridToggled'
        QtMocHelpers::SignalData<void(bool)>(23, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Bool, 24 },
        }}),
        // Signal 'zoomInRequested'
        QtMocHelpers::SignalData<void()>(25, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'zoomOutRequested'
        QtMocHelpers::SignalData<void()>(26, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'resetViewRequested'
        QtMocHelpers::SignalData<void()>(27, 2, QMC::AccessPublic, QMetaType::Void),
        // Signal 'stepForwardRequested'
        QtMocHelpers::SignalData<void()>(28, 2, QMC::AccessPublic, QMetaType::Void),
    };
    QtMocHelpers::UintData qt_properties {
    };
    QtMocHelpers::UintData qt_enums {
    };
    return QtMocHelpers::metaObjectData<ControlPanel, qt_meta_tag_ZN12ControlPanelE_t>(QMC::MetaObjectFlag{}, qt_stringData,
            qt_methods, qt_properties, qt_enums);
}
Q_CONSTINIT const QMetaObject ControlPanel::staticMetaObject = { {
    QMetaObject::SuperData::link<QWidget::staticMetaObject>(),
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN12ControlPanelE_t>.stringdata,
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN12ControlPanelE_t>.data,
    qt_static_metacall,
    nullptr,
    qt_staticMetaObjectRelocatingContent<qt_meta_tag_ZN12ControlPanelE_t>.metaTypes,
    nullptr
} };

void ControlPanel::qt_static_metacall(QObject *_o, QMetaObject::Call _c, int _id, void **_a)
{
    auto *_t = static_cast<ControlPanel *>(_o);
    if (_c == QMetaObject::InvokeMetaMethod) {
        switch (_id) {
        case 0: _t->insertRequested((*reinterpret_cast<std::add_pointer_t<int>>(_a[1]))); break;
        case 1: _t->deleteRequested((*reinterpret_cast<std::add_pointer_t<int>>(_a[1]))); break;
        case 2: _t->searchRequested((*reinterpret_cast<std::add_pointer_t<int>>(_a[1]))); break;
        case 3: _t->clearRequested(); break;
        case 4: _t->randomRequested((*reinterpret_cast<std::add_pointer_t<int>>(_a[1]))); break;
        case 5: _t->stepModeToggled((*reinterpret_cast<std::add_pointer_t<bool>>(_a[1]))); break;
        case 6: _t->autoModeRequested(); break;
        case 7: _t->degreeChanged((*reinterpret_cast<std::add_pointer_t<int>>(_a[1]))); break;
        case 8: _t->speedChanged((*reinterpret_cast<std::add_pointer_t<double>>(_a[1]))); break;
        case 9: _t->undoRequested(); break;
        case 10: _t->redoRequested(); break;
        case 11: _t->saveRequested(); break;
        case 12: _t->loadRequested(); break;
        case 13: _t->exportRequested(); break;
        case 14: _t->themeToggled((*reinterpret_cast<std::add_pointer_t<bool>>(_a[1]))); break;
        case 15: _t->gridToggled((*reinterpret_cast<std::add_pointer_t<bool>>(_a[1]))); break;
        case 16: _t->zoomInRequested(); break;
        case 17: _t->zoomOutRequested(); break;
        case 18: _t->resetViewRequested(); break;
        case 19: _t->stepForwardRequested(); break;
        default: ;
        }
    }
    if (_c == QMetaObject::IndexOfMethod) {
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(int )>(_a, &ControlPanel::insertRequested, 0))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(int )>(_a, &ControlPanel::deleteRequested, 1))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(int )>(_a, &ControlPanel::searchRequested, 2))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::clearRequested, 3))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(int )>(_a, &ControlPanel::randomRequested, 4))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(bool )>(_a, &ControlPanel::stepModeToggled, 5))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::autoModeRequested, 6))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(int )>(_a, &ControlPanel::degreeChanged, 7))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(double )>(_a, &ControlPanel::speedChanged, 8))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::undoRequested, 9))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::redoRequested, 10))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::saveRequested, 11))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::loadRequested, 12))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::exportRequested, 13))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(bool )>(_a, &ControlPanel::themeToggled, 14))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)(bool )>(_a, &ControlPanel::gridToggled, 15))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::zoomInRequested, 16))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::zoomOutRequested, 17))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::resetViewRequested, 18))
            return;
        if (QtMocHelpers::indexOfMethod<void (ControlPanel::*)()>(_a, &ControlPanel::stepForwardRequested, 19))
            return;
    }
}

const QMetaObject *ControlPanel::metaObject() const
{
    return QObject::d_ptr->metaObject ? QObject::d_ptr->dynamicMetaObject() : &staticMetaObject;
}

void *ControlPanel::qt_metacast(const char *_clname)
{
    if (!_clname) return nullptr;
    if (!strcmp(_clname, qt_staticMetaObjectStaticContent<qt_meta_tag_ZN12ControlPanelE_t>.strings))
        return static_cast<void*>(this);
    return QWidget::qt_metacast(_clname);
}

int ControlPanel::qt_metacall(QMetaObject::Call _c, int _id, void **_a)
{
    _id = QWidget::qt_metacall(_c, _id, _a);
    if (_id < 0)
        return _id;
    if (_c == QMetaObject::InvokeMetaMethod) {
        if (_id < 20)
            qt_static_metacall(this, _c, _id, _a);
        _id -= 20;
    }
    if (_c == QMetaObject::RegisterMethodArgumentMetaType) {
        if (_id < 20)
            *reinterpret_cast<QMetaType *>(_a[0]) = QMetaType();
        _id -= 20;
    }
    return _id;
}

// SIGNAL 0
void ControlPanel::insertRequested(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 0, nullptr, _t1);
}

// SIGNAL 1
void ControlPanel::deleteRequested(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 1, nullptr, _t1);
}

// SIGNAL 2
void ControlPanel::searchRequested(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 2, nullptr, _t1);
}

// SIGNAL 3
void ControlPanel::clearRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 3, nullptr);
}

// SIGNAL 4
void ControlPanel::randomRequested(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 4, nullptr, _t1);
}

// SIGNAL 5
void ControlPanel::stepModeToggled(bool _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 5, nullptr, _t1);
}

// SIGNAL 6
void ControlPanel::autoModeRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 6, nullptr);
}

// SIGNAL 7
void ControlPanel::degreeChanged(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 7, nullptr, _t1);
}

// SIGNAL 8
void ControlPanel::speedChanged(double _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 8, nullptr, _t1);
}

// SIGNAL 9
void ControlPanel::undoRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 9, nullptr);
}

// SIGNAL 10
void ControlPanel::redoRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 10, nullptr);
}

// SIGNAL 11
void ControlPanel::saveRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 11, nullptr);
}

// SIGNAL 12
void ControlPanel::loadRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 12, nullptr);
}

// SIGNAL 13
void ControlPanel::exportRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 13, nullptr);
}

// SIGNAL 14
void ControlPanel::themeToggled(bool _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 14, nullptr, _t1);
}

// SIGNAL 15
void ControlPanel::gridToggled(bool _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 15, nullptr, _t1);
}

// SIGNAL 16
void ControlPanel::zoomInRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 16, nullptr);
}

// SIGNAL 17
void ControlPanel::zoomOutRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 17, nullptr);
}

// SIGNAL 18
void ControlPanel::resetViewRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 18, nullptr);
}

// SIGNAL 19
void ControlPanel::stepForwardRequested()
{
    QMetaObject::activate(this, &staticMetaObject, 19, nullptr);
}
QT_WARNING_POP
