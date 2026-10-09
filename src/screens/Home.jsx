export default function Home({ onHost, onJoin, onHotseat, onCatalog }) {
  return (
    <div className="stage">
      <div className="fit">
        <div className="home-kicker">Elliott Bay</div>
        <h1 className="home-title">Seattle Deckbuilder</h1>
        <div className="home-rule" />
        <p className="home-tag">Play a hand on one phone, or deal a table across two.</p>
        <div className="home-btn btn-a" onClick={onHost}>Host</div>
        <div className="home-btn btn-b" onClick={onJoin}>Join</div>
        <div className="home-btn btn-c" onClick={onHotseat}>Pass and play</div>
        <div className="home-btn btn-d" onClick={onCatalog}>View all cards</div>
        <div className="icon-credit">Icons by Lorc and Delapouite · game-icons.net</div>
      </div>
    </div>
  )
}
