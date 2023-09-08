import * as user from '../user';
import * as posts from '../posts';
import * as flags from '../flags';
import * as analytics from '../analytics';
import * as plugins from '../plugins';
import * as pagination from '../pagination';
import * as privileges from '../privileges';
import * as utils from '../utils';
import * as helpers from './helpers';

interface ModsController {
  flags: {
    list: (req, res) => Promise<void>;
    detail: (req, res, next) => Promise<void>;
    postQueue: (req, res, next) => Promise<void>;
  };
}

const modsController: ModsController = {} as ModsController;

modsController.flags.list = async function (req, res) {
    const validFilters: string[] = ['assignee', 'state', 'reporterId', 'type', 'targetUid', 'cid', 'quick', 'page', 'perPage'];
    const validSorts: string[] = ['newest', 'oldest', 'reports', 'upvotes', 'downvotes', 'replies'];

    const results = await Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.isAdminOrGlobalMod(req.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.getModeratedCids(req.uid),
        plugins.hooks.fire('filter:flags.validateFilters', { filters: validFilters }),
        plugins.hooks.fire('filter:flags.validateSort', { sorts: validSorts }),
    ]);
    const [isAdminOrGlobalMod, moderatedCids,, { sorts }] = results;

    let [,, { filters }] = results;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!(isAdminOrGlobalMod || !!moderatedCids.length)) {
        return helpers.notAllowed(req, res);
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!isAdminOrGlobalMod && moderatedCids.length) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        res.locals.cids = moderatedCids.map(cid => String(cid));
    }

    // Parse query string params for filters, eliminate non-valid filters
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    filters = filters.reduce((memo, cur) => {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (req.query.hasOwnProperty(cur)) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (typeof req.query[cur] === 'string' && req.query[cur].trim() !== '') {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                memo[cur] = req.query[cur].trim();
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            } else if (Array.isArray(req.query[cur]) && req.query[cur].length) {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                memo[cur] = req.query[cur];
            }
        }

        return memo;
    }, {});

    let hasFilter = !!Object.keys(filters).length;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (res.locals.cids) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!filters.cid) {
        // If mod and no cid filter, add filter for their modded categories
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            filters.cid = res.locals.cids;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        } else if (Array.isArray(filters.cid)) {
        // Remove cids they do not moderate
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            filters.cid = filters.cid.filter(cid => res.locals.cids.includes(String(cid)));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        } else if (!res.locals.cids.includes(String(filters.cid))) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            filters.cid = res.locals.cids;
            hasFilter = false;
        }
    }

    // Pagination doesn't count as a filter
    if (
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (Object.keys(filters).length === 1 && filters.hasOwnProperty('page')) ||
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (Object.keys(filters).length === 2 && filters.hasOwnProperty('page') && filters.hasOwnProperty('perPage'))
    ) {
        hasFilter = false;
    }

    // Parse sort from query string
    let sort;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (req.query.sort) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        sort = sorts.includes(req.query.sort) ? req.query.sort : null;
    }
    if (sort === 'newest') {
        sort = undefined;
    }
    hasFilter = hasFilter || !!sort;

    const [flagsData, analyticsData, selectData] = await Promise.all([
        flags.list({
            filters: filters,
            sort: sort,
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            uid: req.uid,
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            query: req.query,
        }),
        analytics.getDailyStatsForSet('analytics:flags', Date.now(), 30),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        helpers.getSelectedCategory(filters.cid),
    ]);

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    res.render('flags/list', {
        flags: flagsData.flags,
        analytics: analyticsData,
        selectedCategory: selectData.selectedCategory,
        hasFilter: hasFilter,
        filters: filters,
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        expanded: !!(filters.assignee || filters.reporterId || filters.targetUid),
        sort: sort || 'newest',
        title: '[[pages:flags]]',
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        pagination: pagination.create(flagsData.page, flagsData.pageCount, req.query),
        breadcrumbs: helpers.buildBreadcrumbs([{ text: '[[pages:flags]]' }]),
    });
};

modsController.flags.detail = async function (req, res, next) {
    const results = await utils.promiseParallel({
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        isAdminOrGlobalMod: user.isAdminOrGlobalMod(req.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        moderatedCids: user.getModeratedCids(req.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        flagData: flags.get(req.params.flagId),
        assignees: user.getAdminsandGlobalModsandModerators(),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        privileges: Promise.all(['global', 'admin'].map(async type => privileges[type].get(req.uid))),
    });
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    results.privileges = { ...results.privileges[0], ...results.privileges[1] };

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!results.flagData || (!(results.isAdminOrGlobalMod || !!results.moderatedCids.length))) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return next(); // 404
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    results.flagData.history = results.isAdminOrGlobalMod ? (await flags.getHistory(req.params.flagId)) : null;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (results.flagData.type === 'user') {
        // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results.flagData.type_path = 'uid';
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    } else if (results.flagData.type === 'post') {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results.flagData.type_path = 'post';
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    res.render('flags/detail', Object.assign(results.flagData, {
        assignees: results.assignees,
        type_bool: ['post', 'user', 'empty'].reduce((memo, cur) => {
            if (cur !== 'empty') {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                memo[cur] = results.flagData.type === cur && (
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    !results.flagData.target ||
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            !!Object.keys(results.flagData.target).length
                );
            } else {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                memo[cur] = !Object.keys(results.flagData.target).length;
            }

            return memo;
        }, {}),
        states: Object.fromEntries(flags._states),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        title: `[[pages:flag-details, ${req.params.flagId}]]`,
        privileges: results.privileges,
        breadcrumbs: helpers.buildBreadcrumbs([
            { text: '[[pages:flags]]', url: '/flags' },
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            { text: `[[pages:flag-details, ${req.params.flagId}]]` },
        ]),
    }));
};

modsController.flags.postQueue = async function (req, res, next): Promise<void> {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!req.loggedIn) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return next();
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const { id }: { id: string } = req.params;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const { cid }: { cid: string } = req.query;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const page = parseInt(req.query.page, 10) || 1;
    const postsPerPage = 20;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    let postData: any[] = await posts.getQueuedPosts({ id: id });
    const [isAdmin, isGlobalMod, moderatedCids, categoriesData]: [boolean, boolean, number[], any] = await Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.isAdministrator(req.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.isGlobalModerator(req.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.getModeratedCids(req.uid),
        helpers.getSelectedCategory(cid),
    ]);

    postData = postData.filter(p => p &&
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (!categoriesData.selectedCids.length || categoriesData.selectedCids.includes(p.category.cid)) &&
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (isAdmin || isGlobalMod || moderatedCids.includes(Number(p.category.cid)) || req.uid === p.user.uid));

    ({ posts: postData } = await plugins.hooks.fire('filter:post-queue.get', {
        posts: postData,
        req: req,
    }));

    const pageCount: number = Math.max(1, Math.ceil(postData.length / postsPerPage));
    const start: number = (page - 1) * postsPerPage;
    const stop: number = start + postsPerPage - 1;
    postData = postData.slice(start, stop + 1);
    const crumbs: { text: string, url?: string }[] = [{ text: '[[pages:post-queue]]', url: id ? '/post-queue' : undefined }];
    if (id && postData.length) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const text: string = postData[0].data.tid ? '[[post-queue:reply]]' : '[[post-queue:topic]]';
        crumbs.push({ text: text });
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    res.render('post-queue', {
        title: '[[pages:post-queue]]',
        posts: postData,
        isAdmin: isAdmin,
        canAccept: (isAdmin || isGlobalMod || !!moderatedCids.length),
        ...categoriesData,
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        allCategoriesUrl: `post-queue${helpers.buildQueryString(req.query, 'cid', '')}`,
        pagination: pagination.create(page, pageCount),
        breadcrumbs: helpers.buildBreadcrumbs(crumbs),
        singlePost: !!id,
    });
};
