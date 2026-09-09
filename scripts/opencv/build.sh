#!/usr/bin/env bash
set -euo pipefail

readonly SOURCE_DIR=/opt/opencv
readonly BUILD_DIR=/opt/opencv-build
readonly OUTPUT_DIR=/opt/opencv-csp/out
readonly BINDINGS_CONFIG=/opt/opencv-csp/opencv_js.config.py

python3 "${SOURCE_DIR}/platforms/js/build_js.py" "${BUILD_DIR}" \
  --opencv_dir "${SOURCE_DIR}" \
  --build_wasm \
  --disable_single_file \
  --config "${BINDINGS_CONFIG}" \
  --cmake_option="-DCMAKE_BUILD_TYPE=Release" \
  --cmake_option="-DCMAKE_CXX_STANDARD=17" \
  --cmake_option="-DCMAKE_CXX_STANDARD_REQUIRED=ON" \
  --cmake_option="-DBUILD_LIST=core,imgproc,features,js" \
  --cmake_option="-DBUILD_opencv_calib3d=OFF" \
  --cmake_option="-DBUILD_SHARED_LIBS=OFF" \
  --cmake_option="-DBUILD_TESTS=OFF" \
  --cmake_option="-DBUILD_PERF_TESTS=OFF" \
  --cmake_option="-DBUILD_EXAMPLES=OFF" \
  --cmake_option="-DBUILD_DOCS=OFF" \
  --cmake_option="-DEMSCRIPTEN_LINK_FLAGS=-O3 -s EXPORT_ES6=1 -s DYNAMIC_EXECUTION=0 -s EMBIND_AOT=1 -s ENVIRONMENT=worker" \
  --build_flags="-O3"

mkdir -p "${OUTPUT_DIR}"
cp "${BUILD_DIR}/bin/opencv_js.js" "${OUTPUT_DIR}/opencv.mjs"
cp "${BUILD_DIR}/bin/opencv_js.wasm" "${OUTPUT_DIR}/opencv.wasm"
cp "${SOURCE_DIR}/LICENSE" "${OUTPUT_DIR}/LICENSE.txt"
cp "${SOURCE_DIR}/3rdparty/readme.txt" "${OUTPUT_DIR}/THIRD_PARTY_NOTICES.txt"
cp /opt/opencv-csp/build-manifest.json "${OUTPUT_DIR}/build-manifest.json"
(cd "${OUTPUT_DIR}" && sha256sum opencv.mjs opencv.wasm LICENSE.txt THIRD_PARTY_NOTICES.txt > SHA256SUMS)
