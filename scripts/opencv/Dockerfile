FROM emscripten/emsdk:4.0.20@sha256:460fff8f8ac87e11b16447fbd66538a686eafa0e4fb977aa0989ed19fe2079f7

ARG OPENCV_TAG=5.0.0
ARG OPENCV_COMMIT=40738fb16ceddb5fb3fea747585f7ce6abb0605b

RUN git clone --filter=blob:none --no-checkout https://github.com/opencv/opencv.git /opt/opencv \
    && git -C /opt/opencv fetch --depth 1 origin "refs/tags/${OPENCV_TAG}:refs/tags/${OPENCV_TAG}" \
    && git -C /opt/opencv checkout --detach "${OPENCV_COMMIT}" \
    && test "$(git -C /opt/opencv rev-parse HEAD)" = "${OPENCV_COMMIT}"

COPY opencv_js.config.py /opt/opencv-csp/opencv_js.config.py
COPY opencv-5.0.0-js-minimal.patch /opt/opencv-csp/opencv-5.0.0-js-minimal.patch
COPY build-manifest.json /opt/opencv-csp/build-manifest.json
COPY build.sh /opt/opencv-csp/build.sh

RUN git -C /opt/opencv apply --check /opt/opencv-csp/opencv-5.0.0-js-minimal.patch \
    && git -C /opt/opencv apply /opt/opencv-csp/opencv-5.0.0-js-minimal.patch \
    && chmod +x /opt/opencv-csp/build.sh \
    && /opt/opencv-csp/build.sh

CMD ["bash", "-lc", "cp -a /opt/opencv-csp/out/. /out/"]
