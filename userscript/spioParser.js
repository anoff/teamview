class SpioParser {
  isSpioPage () {
    return window.location.search.includes('page=messages') && window.location.search.includes('category=0')
  }

  getMessages () {
    const htmlElements = document.getElementsByClassName('message_head')
    const messages = []
    for (const m of htmlElements) {
      if (!m) return
      const id = parseInt(m.id.split('_')[1])
      const header = m.innerText.trim()
      const body = document.getElementsByClassName(`message_${id} messages_body`)[0].innerText.trim()
      messages.push({
        id,
        header,
        body
      })
    }
    return messages
  }

  parse_text ({
    id,
    header,
    body
  }) {
    function parseDate (dateRaw) {
      const monthMapping = languageMap.months
      // make sure date format is english
      for (const monthDE in monthMapping) {
        dateRaw = dateRaw.replace(monthDE, monthMapping[monthDE])
      }
      // move around day so it can be parsed
      const parts = dateRaw.split(' ')
      const date = new Date([parts[1], parts[0].replace('.', ''), parts.slice(2)].join(' '))
      return date
    }

    function parsePlanet (report) {
      return report.split('[')[1].split(']')[0]
    }

    const [dateRaw] = header.split(/\t/)
    const [report] = body.split(/\n\n/)
    const [title, ...content] = report.split(/\n/)
    const date = parseDate(dateRaw).toISOString()
    const planet = parsePlanet(title)
    return {
      id,
      date,
      planet,
      content
    }
  }
}

const languageMap = {
  months: {
    Jan: 'Jan',
    Feb: 'Feb',
    Mär: 'Mar',
    Apr: 'Apr',
    Mai: 'May',
    Jun: 'Jun',
    Jul: 'Jul',
    Aug: 'Aug',
    Sep: 'Sep',
    Okt: 'Oct',
    Nov: 'Nov',
    Dez: 'Dec'
  }
}

module.exports = {
  SpioParser,
  languageMap
}
