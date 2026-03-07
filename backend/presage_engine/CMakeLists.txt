cmake_minimum_required(VERSION 3.27.0)
project(SanctiiEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SmartSpectra REQUIRED)
find_package(OpenCV REQUIRED)
find_package(CURL REQUIRED)

add_executable(hello_vitals hello_vitals.cpp)

target_link_libraries(hello_vitals
    SmartSpectra::Container
    SmartSpectra::Gui
    ${OpenCV_LIBS}
    CURL::libcurl
)
