export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-xl font-semibold">页面不存在</h1>
      <a href="/" className="text-primary underline">
        返回首页
      </a>
    </div>
  );
}
