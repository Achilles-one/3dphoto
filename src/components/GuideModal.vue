<script setup lang="ts">
const emit = defineEmits<{
  closed: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="emit('closed')">
      <section
        class="guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <header class="guide-header">
          <div>
            <p class="panel-kicker">Upload guide</p>
            <h2 id="guide-title">What kind of photo should I upload?</h2>
          </div>
          <button class="modal-close" type="button" aria-label="Close guide" @click="emit('closed')">
            Close
          </button>
        </header>

        <p class="guide-copy">
          This tool works with 3D photos that contain two views. Upload an SBS
          or top-bottom image, or an MPO file from a 3D camera. MPO files with
          more than two views use the first two views.
        </p>

        <p class="guide-copy">
          For the best wiggle, review the split views first, align the main
          subject until both views overlap cleanly, then create the animation.
          Alignment stabilizes the subject; Wiggle Amount controls how strongly
          the final animation moves.
        </p>

        <div class="guide-grid">
          <article class="guide-card">
            <h3>Recommended</h3>
            <div class="format-example side-by-side" aria-hidden="true">
              <span>Left view</span>
              <span>Right view</span>
            </div>
            <p>Side-by-side / SBS</p>
          </article>

          <article class="guide-card">
            <h3>Also supported</h3>
            <div class="format-example top-bottom" aria-hidden="true">
              <span>Left view</span>
              <span>Right view</span>
            </div>
            <p>Top-bottom stereo image</p>
          </article>

          <article class="guide-card">
            <h3>Also supported</h3>
            <div class="format-example mpo" aria-hidden="true">
              <span>View 1</span>
              <span>View 2</span>
            </div>
            <p>MPO stereo file</p>
          </article>
        </div>

        <div class="unsupported-list">
          <h3>Not supported yet</h3>
          <ul>
            <li>Regular single 2D photos</li>
            <li>Two separate image uploads</li>
            <li>MPO files with fewer than two valid views</li>
          </ul>
        </div>

        <button class="primary-action" type="button" @click="emit('closed')">
          Got it
        </button>
      </section>
    </div>
  </Teleport>
</template>
