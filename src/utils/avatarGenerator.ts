export const generateAvatar = (username: string): string => {
  const styles = ["adventurer", "avataaars", "big-ears", "big-smile", "croodles", "fun-emoji"]
  const randomStyle = styles[Math.floor(Math.random() * styles.length)]

  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}
