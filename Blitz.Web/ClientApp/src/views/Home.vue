<template>
  <div class="home">
    <article class="section container">
      <h1 class="app-title">🗲 blitz</h1>
      <ul class="app-parts columns is-6 is-desktop">
        <li class="column">
          <router-link to="/projects">
            <article class="home-card is-flex is-justify-content-center is-align-items-center">
              <div>
                <figure class="card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
                    <path
                        d="M576 415.5q52.5 0 90 38.3t37.5 90.7-37.5 90-90 37.5-90-37.5-37.5-90 37.5-90.8 90-38.2zM384 96q52.5 0 90 37.5t37.5 90-37.5 90.8-90 38.2-90-38.3-37.5-90.7 37.5-90T384 96zM192 415.5q52.5 0 90 38.3t37.5 90.7-37.5 90-90 37.5-90-37.5-37.5-90 37.5-90.8 90-38.2z"/>
                  </svg>
                </figure>
                <h1 class="title is-5 has-text-centered">Projects</h1>
              </div>
            </article>
          </router-link>
        </li>
        <li class="column">
          <router-link to="/cronjobs">
            <article class="home-card is-flex is-justify-content-center is-align-items-center">
              <div>
                <figure class="card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
                    <path
                        d="M384 640.5q93 0 158.3-66t65.2-159-65.3-158.3T384 192t-158.3 65.3-65.2 158.2 65.3 159 158.2 66zM609 237q25.5 33 44.3 84.8t18.7 93.7q0 118.5-84 203.3t-204 84.7-204-84.8-84-203.2 84-203.3 204-84.7q40.5 0 93.8 19.5t86.2 45l45-46.5q24 19.5 45 45zM352.5 448.5v-192h63v192h-63zM480 31.5V96H288V31.5h192z"/>
                  </svg>
                </figure>
                <h1 class="title is-5 has-text-centered">Cronjobs</h1>
              </div>
            </article>
          </router-link>
        </li>
        <li class="column">
          <router-link to="/executions">
            <article class="home-card is-flex is-justify-content-center is-align-items-center">
              <div>
                <figure class="card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
                    <path
                        d="M316.5 619.5L93 576l12-64.5L262.5 543l51-259.5L255 306v109.5h-63v-150L358.5 195q4.5 0 12.8-1.5T384 192q31.5 0 54 31.5l31.5 51Q513 351 607.5 351v64.5Q501 415.5 432 336l-19.5 96 67.5 63v240h-64.5V543L348 480zm115.5-444q-25.5 0-45-19.5t-19.5-45T387 66.7 432 48t44.3 18.8T495 111t-18.8 45-44.2 19.5z"/>
                  </svg>
                </figure>
                <h1 class="title is-5 has-text-centered">Executions</h1>
              </div>
            </article>
          </router-link>
        </li>
      </ul>
    </article>
  </div>
</template>

<script>

export default {
  name: 'Home',
  components: {},
  data() {
    return {}
  }
}
</script>

<style scoped>
.app-title {
  font-size: calc(2em + 1vw);
  font-weight: 600;
  text-align: center;
  color: #ffd65b;
}
.app-parts {
  margin-top: 4rem;
}
.home-card {
  /*color: #ffd65b;*/
  border-radius: 2rem;
  box-shadow: 0 0.25rem 2rem -0.5rem rgba(0,0,0, 0.1);
  padding: 2rem;
  min-height: 15rem;
  aspect-ratio: 5/4;
  transition: 0.2s;
}
.home-card:hover {
  box-shadow: 0 0.5rem 3rem -0.5rem rgba(0,0,0, 0.2);
}

.card-icon {
  display: block;
  margin: 0;
  padding: 1rem;
  text-align: center;
  width: 6rem;
  height: 6rem;
}

.card-icon svg {
  fill: currentColor;
}
</style>
