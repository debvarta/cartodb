import datasets from '../../fixtures/datasets';
import DatasetsStore from 'new-dashboard/store/datasets';
import toObject from 'new-dashboard/utils/to-object';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = DatasetsStore.mutations;
const actions = DatasetsStore.actions;

describe('DatasetsStore', () => {
  describe('mutations', () => {
    it('setRequestError', () => {
      let state = {
        isFetching: false,
        isErrored: false,
        error: {}
      };

      let err = { status: 404 };
      mutations.setRequestError(state, err);

      expect(state).toEqual({
        isFetching: false,
        isErrored: true,
        error: err
      });
    });

    it('setDatasets', () => {
      let state = {
        list: {},
        metadata: {},
        isFetching: true
      };

      mutations.setDatasets(state, datasets);

      expect(state).toEqual({
        list: toObject(datasets.visualizations, 'id'),
        metadata: {
          total_entries: datasets.total_entries,
          total_likes: datasets.total_likes,
          total_shared: datasets.total_shared,
          total_user_entries: datasets.total_user_entries
        },
        isFetching: false
      });
    });

    it('setFetchingState', () => {
      let state = {
        isFetching: false,
        isErrored: false,
        error: {}
      };

      mutations.setFetchingState(state);

      expect(state).toEqual({
        isFetching: true,
        isErrored: false,
        error: {}
      });
    });

    it('setDatasetAttributes', () => {
      let state = {
        list: {
          'fake-dataset-id': {
            id: 'fake-dataset-id',
            name: '',
            description: ''
          }
        }
      };

      mutations.setDatasetAttributes(state, {
        datasetId: 'fake-dataset-id',
        datasetAttributes: {
          name: 'Fake Dataset Name',
          description: 'Fake Dataset Description'
        }
      });

      expect(state).toEqual({
        list: {
          'fake-dataset-id': {
            id: 'fake-dataset-id',
            name: 'Fake Dataset Name',
            description: 'Fake Dataset Description'
          }
        }
      });
    });

    it('setURLOptions', () => {
      let state = {
        page: 1,
        filterType: 'mine',
        order: 'updated_at',
        orderDirection: 'desc'
      };

      mutations.setURLOptions(state, {
        filter: 'liked',
        page: 2,
        order: 'name',
        order_direction: 'asc'
      });

      expect(state).toEqual({
        page: 2,
        filterType: 'liked',
        order: 'name',
        orderDirection: 'asc'
      });
    });

    it('setPagination', () => {
      let state = {
        page: 1,
        numPages: 1,
        metadata: {
          total_entries: 25
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 3,
        metadata: {
          total_entries: 25
        }
      });
    });
  });

  describe('actions', () => {
    describe('fetchDatasets', () => {
      let state;
      beforeEach(() => {
        state = {
          isFetching: false,
          isFiltered: false,
          isErrored: false,
          error: {},
          filterType: 'mine',
          order: 'updated_at',
          list: {},
          metadata: {},
          page: 1,
          numPages: 1
        };
      });

      it('success', done => {
        testAction(actions.fetchDatasets, null, state, [
          { type: 'setFetchingState' },
          { type: 'setDatasets', payload: datasets },
          { type: 'setPagination', payload: state.page }
        ], [], done);
      });

      it('errored', done => {
        state.order = false;
        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };

        testAction(actions.fetchDatasets, null, state, [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ], [], done);
      });
    });

    it('setURLOptions', done => {
      const URLOptions = { filter: 'favorited', page: 2 };
      testAction(actions.setURLOptions, URLOptions, null,
        [{ type: 'setURLOptions', payload: URLOptions }],
        [{ type: 'fetchDatasets' }], done);
    });

    it('updateDataset', done => {
      const datasetOptions = {
        datasetId: 'fake-dataset-id',
        datasetAttributes: {
          name: 'Fake Dataset Name',
          description: 'Fake Dataset Description'
        }
      };

      testAction(actions.updateDataset, datasetOptions, null, [
        { type: 'setDatasetAttributes', payload: datasetOptions }
      ], [], done);
    });

    describe('like', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(datasets.visualizations, 'id')
        };
      });
      it('success', done => {
        const datasetId = '8b2fa51d-618c-48ea-8c4c-4aa5e9a93a90';
        testAction(actions.like, state.list[datasetId], state, [
          { type: 'updateLike', payload: { datasetId: datasetId, liked: true } },
          { type: 'updateNumberLikes', payload: { datasetId: datasetId, likes: state.list[datasetId].likes + 1 } }
        ], [], done);
      });

      it('errored', done => {
        const datasetIdErr = 'ba8b2bc3-a105-4640-b258-286fcf6f3050';
        const currentLikeStatus = state.list[datasetIdErr].liked;
        testAction(actions.like, state.list[datasetIdErr], state, [
          { type: 'updateLike', payload: { datasetId: datasetIdErr, liked: true } },
          { type: 'updateLike', payload: { datasetId: datasetIdErr, liked: currentLikeStatus } }
        ], [], done);
      });
    });

    describe('deleteLikeDataset', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(datasets.visualizations, 'id')
        };
      });
      it('success', done => {
        const datasetId = 'ba8b2bc3-a105-4640-b258-286fcf6f3050';
        testAction(actions.deleteLike, state.list[datasetId], state, [
          { type: 'updateLike', payload: { datasetId: datasetId, liked: false } },
          { type: 'updateNumberLikes', payload: { datasetId: datasetId, likes: state.list[datasetId].likes - 1 } }
        ], [], done);
      });
    });
  });
});