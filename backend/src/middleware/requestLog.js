// PR-40: 메서드·경로·상태·시간만. 헤더·본문·쿼리는 남기지 않는다
export function requestLog(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
}
