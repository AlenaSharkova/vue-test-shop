<script setup lang="ts">
import {computed} from "vue";
import {getFormattedTimer} from '@/utils';
import BaseIcon from "@/components/Base/BaseIcon.vue";

const RATE_MIN = 20;
const RATE_MAX = 80;

const props = defineProps<{
  timeToUpdateMs: number;
}>();

const emits = defineEmits<{
  (e: 'update-timer'): void;
}>();

const usdRate = defineModel<number>({ required: true });

const timerData = computed(() => getFormattedTimer(props.timeToUpdateMs));

const updateTimer = () => {
  emits('update-timer')
}

const blockNonDigits = (event: InputEvent) => {
  if (event.data && /\D/.test(event.data)) {
    event.preventDefault();
  }
}

const onRateChange = () => {
  usdRate.value = Math.min(Math.max(Math.round(usdRate.value ?? RATE_MIN) || RATE_MIN, RATE_MIN), RATE_MAX);
}
</script>

<template>

  <div class="rate-control">
    <div
        class="rate-control__line"
        :style="{width: `${timerData.progress}%` }"
    ></div>

    <div class="rate-control__wrapper">
      <div class="rate-control__update">
        <p>Обновление через: </p>
        <div class="rate-control__update-timer timer">
          <span class="timer-seconds">{{ timerData.seconds }}</span>
          <span class="timer-milliseconds">.{{ timerData.ms }}</span>
          <span class="timer-unit"> сек</span>
        </div>
        <div class="rate-control__update-icon"
             @click="updateTimer"
        >
          <BaseIcon class="icon" name="update" />
        </div>
      </div>
      <div class="rate-control__usd">
        <p class="usd-text">Курс USD/RUB: </p>
        <div class="usd-value">
          <input
              class="usd-value__input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              v-model.number="usdRate"
              @beforeinput="blockNonDigits"
              @change="onRateChange"
              @keyup.enter="($event.target as HTMLInputElement).blur()"
          />
          <span class="usd-value__symbol"> ₽</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rate-control {
  min-width: 200px;
  border-radius: 10px;
  background: var(--bg-primary);
  position: relative;
  box-shadow: var(--box-shadow-primary);
  overflow: hidden;
  &__line {
    background: var(--bg-accent);
    opacity: 0.6;
    position: absolute;
    top: 0;
    height: 3px;
    border-radius: 1px;
  }
  &__wrapper {
    padding: 10px 12px;
    font-size: 16px;
  }
  &__update {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    align-items: center;
    &-timer {
      width: 90px;
    }
    &-icon {
      cursor: pointer;
      @media (hover: hover) {
        &:hover {
          color: var(--bg-accent);
        }
      }
      &:active {
        color: var(--bg-secondary);
      }
      .icon {
        font-size: 23px;
      }
    }
  }
  &__usd {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    align-items: center;
    justify-content: space-between;
    .usd-value {
      &__input {
        width: 70px;
        height: 30px;
        background: var(--bg-secondary);
        border: 1px solid var(--bg-accent);
        border-radius: 5px;
        box-shadow: var(--box-shadow-primary);
        font-size: 20px;
      }
    }
  }
}
</style>