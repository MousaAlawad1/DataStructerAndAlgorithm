cmake_minimum_required(VERSION 3.16)
project(BTreeVisualizer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 REQUIRED COMPONENTS 
    Core 
    Widgets 
    Gui 
    PrintSupport
)

set(SOURCES
    src/main.cpp
    src/btree/BTreeNode.cpp
    src/btree/BTree.cpp
    src/ui/MainWindow.cpp
    src/ui/TreeVisualizer.cpp
    src/ui/ControlPanel.cpp
    src/ui/InfoPanel.cpp
    src/animation/AnimationController.cpp
    src/utils/OperationLogger.cpp
    src/utils/StyleManager.cpp
)

set(HEADERS
    src/btree/BTreeNode.h
    src/btree/BTree.h
    src/ui/MainWindow.h
    src/ui/TreeVisualizer.h
    src/ui/ControlPanel.h
    src/ui/InfoPanel.h
    src/animation/AnimationController.h
    src/utils/OperationLogger.h
    src/utils/StyleManager.h
)

add_executable(BTreeVisualizer ${SOURCES} ${HEADERS})

target_link_libraries(BTreeVisualizer PRIVATE
    Qt6::Core
    Qt6::Widgets
    Qt6::Gui
    Qt6::PrintSupport
)

target_include_directories(BTreeVisualizer PRIVATE src)