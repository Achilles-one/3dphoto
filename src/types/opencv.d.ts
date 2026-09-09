declare module '@/vendor/opencv/5.0.0/opencv.mjs' {
  interface OpenCvModuleOptions {
    locateFile?: (path: string, prefix: string) => string;
  }

  const createOpenCv: (options?: OpenCvModuleOptions) => Promise<any>;
  export default createOpenCv;
}
