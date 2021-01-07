class Utilities {
  static newBlob(data: Buffer, contentType: string, name: string): File {
  }
  static sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static base64Decode(data: string): Buffer {
    return Buffer.from(data, 'base64');
  }
}