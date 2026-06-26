export interface GitHubImageConfig {
  enabled: boolean
  token: string
  owner: string
  repo: string
  branch: string
  path: string
}

/**
 * 上传图片到 GitHub 仓库，返回 raw.githubusercontent.com URL
 */
export async function uploadToGitHub(
  file: File,
  config: GitHubImageConfig
): Promise<string> {
  const { token, owner, repo, branch, path } = config

  // 读取文件为 base64
  const base64 = await fileToBase64(file)
  const filename = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const filePath = path ? `${path}/${filename}` : filename

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `upload image: ${filename}`,
      content: base64,
      branch
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `上传失败 (${res.status})`)
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 去掉 data:image/png;base64, 前缀
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
