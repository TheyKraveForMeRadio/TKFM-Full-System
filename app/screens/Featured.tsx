import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'

const API =
  'https://www.tkfmradio.com/.netlify/functions/public-get-mixtapes'

export default function Featured() {
  const [mixes, setMixes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => {
        const now = Date.now()

        const tierRank = { elite: 3, pro: 2, basic: 1 }

        const featured = data
          .filter(
            m =>
              m.featured === true &&
              (!m.featureExpiresAt || m.featureExpiresAt > now)
          )
          .sort(
            (a, b) =>
              (tierRank[b.featureTier] || 0) -
              (tierRank[a.featureTier] || 0)
          )

        setMixes(featured)
        setLoading(false)
      })
      .catch(err => {
        console.error('Featured fetch failed', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <ActivityIndicator size="large" />
  }

  if (error) {
    return <Text>⚠️ Unable to load featured mixtapes</Text>
  }

  return (
    <ScrollView>
      {mixes.map(m => (
        <View
          key={m.id}
          style={{
            padding: 14,
            marginBottom: 12,
            borderRadius: 10,
            backgroundColor: '#14001f'
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>
            🔥 {m.title}
          </Text>

          <Text>🎧 DJ: {m.djName}</Text>

          <Text>
            💎 Tier: {m.featureTier?.toUpperCase()}
          </Text>

          <Text>
            👁 Views: {m.featuredViews || 0}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}
