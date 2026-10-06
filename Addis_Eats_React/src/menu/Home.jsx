import { Link } from "react-router-dom";
import { useDishes } from "../hooks/useDishes.js";
import CategoryBar from "./CategoryBar.jsx";
import DishCard from "./DishCard.jsx";
import { EmptyState, ErrorState, Loading } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
export default function Home() {
  const { dishes, loading, error, retry } = useDishes();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span className="live-dot" /> Made with love. Delivered with care.
          </span>
          <h1>
            A taste of Addis.
            <br />
            <span>Right at your door.</span>
          </h1>
          <p>
            From comforting Ethiopian classics to your everyday cravings.
            Freshly prepared, just for you.
          </p>
          <Link to="/menu" className="button hero-button">
            Explore the menu
            <Icon name="arrow" />
          </Link>
          <div className="hero-perks">
            <span>
              <Icon name="clock" size={17} /> From 25 min delivery
            </span>
            <span>
              <Icon name="leaf" size={17} /> Fresh ingredients
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit" />
          <img
            className="hero-food"
            src="/images/tibs.jpg"
            alt=""
            fetchPriority="high"
          />
          <div className="hero-sticker">
            <span className="sticker-icon">
              <Icon name="dish" size={25} />
            </span>
            <div>
              <strong>Made in Addis</strong>
              <span>Full of flavor. Full of heart.</span>
            </div>
          </div>
          <span className="hero-spark spark-one">✦</span>
          <span className="hero-spark spark-two">✧</span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR CRAVING</span>
            <h2>What sounds good?</h2>
          </div>
          <Link className="text-link" to="/menu">
            View all
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <CategoryBar />
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE LOCAL FAVORITES</span>
            <h2>Popular dishes</h2>
            <p>A few good reasons to skip cooking today.</p>
          </div>
          <Link className="text-link" to="/menu">
            Full menu
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={retry} />
        ) : dishes.length ? (
          <div className="dish-grid">
            {dishes
              .filter((dish) => dish.popular)
              .concat(dishes.filter((dish) => !dish.popular))
              .slice(0, 4)
              .map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
          </div>
        ) : (
          <EmptyState
            title="Something delicious is on its way"
            description="Our menu is being prepared. Check back soon."
          />
        )}
      </section>
      <section className="delivery-banner">
        <span className="delivery-banner-icon">
          <Icon name="bag" size={40} />
        </span>
        <div>
          <h2>Good food. No extra effort.</h2>
          <p>
            Your favorites, freshly prepared and delivered across Addis Ababa.
          </p>
        </div>
        <Link className="button button-secondary" to="/menu">
          Find your next meal
          <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}
