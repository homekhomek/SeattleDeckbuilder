import { site } from './site.js'

export default function App() {
  return (
    <div className="stage">
      <div className="board">
        <div className="sky" />
        <div className="ridge ridge-a" />
        <div className="ridge ridge-b" />
        <div className="rain" />

        <div className="bldg b1" />
        <div className="bldg b2" />
        <div className="bldg b3" />
        <div className="bldg b4" />
        <div className="bldg b5" />
        <div className="bldg b6" />
        <div className="bldg b7" />
        <div className="light l1" />
        <div className="light l2" />
        <div className="light l3" />
        <div className="light l4" />
        <div className="light l5" />

        <div className="needle-tip" />
        <div className="needle-shaft" />
        <div className="needle-saucer" />

        <div className="water" />
        <div className="horizon" />

        <div className="copy-kicker">{site.kicker}</div>
        <h1 className="copy-title">{site.title}</h1>
        <div className="copy-rule" />
        <p className="copy-tagline">{site.tagline}</p>

        <div className="soon">
          <div className="soon-heading">{site.comingSoon.heading}</div>
          <p className="soon-body">{site.comingSoon.body}</p>
        </div>

        {site.cards.map((card, index) => (
          <div className={`card card-${index}`} key={card.name}>
            <div className="card-frame" />
            <div className="card-stamp">{site.stamp}</div>
            <div className="card-suit">{card.suit}</div>
            <div className="card-name">{card.name}</div>
            <div className="card-text">{card.text}</div>
          </div>
        ))}

        <div className="footer">{site.footer}</div>
      </div>
    </div>
  )
}
