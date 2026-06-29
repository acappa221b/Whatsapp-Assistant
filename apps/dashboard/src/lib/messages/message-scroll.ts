export function shouldStickToBottom(container: { scrollHeight: number; scrollTop: number; clientHeight: number }): boolean {
  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
  return distanceFromBottom < 80
}
