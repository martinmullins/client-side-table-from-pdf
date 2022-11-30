
export const setupAllDropdowns = () => {
    const allDrops = document.querySelectorAll('.dropdown');
    const closeDrops = () => {
        for (const drop of allDrops) {
            drop.classList.remove('is-active');
        }
    }
    document.addEventListener('click' , closeDrops);

    document.addEventListener('keydown', function (event) {
        var e = event || window.event;
        if (e.keyCode === 27) {
            closeDrops();
        }
    });
};

export const setupDropdown = (key, defaultSelected, mainItem, onChange) => {
    const drop = document.querySelector(`.dropdown.${key}`);
    const closeDropdown = () => {
        drop.classList.remove('is-active');
    };

    var trigger = drop.querySelector('.dropdown-trigger');
    trigger.addEventListener('click', (e) => {
        const allDrops = document.querySelectorAll('.dropdown');
        for (const ot of allDrops) {
            if (ot !== drop) {
                ot.classList.remove('is-active');
            }
        }
        drop.classList.toggle('is-active');
        e.stopPropagation();
    });

    var button = trigger.querySelector('button span');
    if (mainItem) {
        button.innerHTML = `${mainItem(defaultSelected)}`;
    }

    var options = drop.querySelectorAll(`.dropdown.${key} .dropdown-item`);
    for (let option of options) {
        option.addEventListener('click', (e) => {
            if (option.classList.contains('is-active')) {
                return;
            }
            for (let op of options) {
                op.classList.remove('is-active');
            }
            onChange(option.dataset.value);
            if (mainItem) {
                button.innerHTML = `${mainItem(option.dataset.value)}`;
                option.classList.add('is-active');
            }
            closeDropdown();
            e.stopPropagation();
        });

        if (option.dataset.value === defaultSelected && mainItem) {
            option.classList.add('is-active');
        }
    }
};