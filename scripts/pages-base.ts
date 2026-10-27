/** configure-pages base_path takes precedence, including an empty root path. */
export function resolvePagesBase(
  repository?: string,
  basePath?: string,
): string {
  if (basePath !== undefined) {
    if (!/^\/?[a-zA-Z0-9._/-]*$/.test(basePath) || basePath.includes("..")) {
      throw new Error(
        "PAGES_BASE_PATH must be a URL path, not a URL or traversal.",
      );
    }
    return basePath.replace(/^\/*|\/*$/g, "")
      ? `/${basePath.replace(/^\/*|\/*$/g, "")}/`
      : "/";
  }
  if (!repository) return "/";
  const [owner, name, extra] = repository.split("/");
  if (
    !owner ||
    !name ||
    extra ||
    !/^[\w.-]+$/.test(owner) ||
    !/^[\w.-]+$/.test(name)
  ) {
    throw new Error("GITHUB_REPOSITORY must be owner/repository.");
  }
  return name.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? "/"
    : `/${name}/`;
}
